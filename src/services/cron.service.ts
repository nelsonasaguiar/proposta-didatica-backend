import cron from 'node-cron';
import { getValidAccessTokenByVehicle } from './brand-token.service';
import { updateVehicleData as updateVehicleDataInDb, logError } from './vehicle-data.service';
import smartcar from 'smartcar';
import supabase from './supabase.service';
import { getAddressFromCoordinates } from '../utils/geocoding';

// Schedule patterns
const EVERY_TWO_HOURS = '0 */2 * * *';  // At minute 0 of every 2nd hour
const EVERY_THREE_HOURS = '0 */3 * * *';  // At minute 0 of every 2nd hour
const EVERY_FOUR_HOURS = '0 */4 * * *';  // At minute 0 of every 4th hour
const EVERY_DAY = '0 0 * * *';          // At 00:00 every day
const EVERY_HOUR = '0 * * * *';         // At minute 0 of every hour

export function startCronJobs(): void {
   // Combined data updates every 2 hours
   cron.schedule(EVERY_FOUR_HOURS, async () => {
      console.log('Running combined vehicle data update job...');
      await updateVehicleData();
   });
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface SmartcarError extends Error {
   retryAfter?: string;
   statusCode?: number;
   type?: string;
}

async function retryWithBackoff<T>(
   operation: () => Promise<T>,
   maxRetries: number = 3
): Promise<T> {
   const retryDelays = [60000, 120000, 180000]; // 60s, 120s, 180s

   for (let retries = 0; retries < maxRetries; retries++) {
      try {
         return await operation();
      } catch (error) {
         const smartcarError = error as SmartcarError;

         if (smartcarError.type === 'RATE_LIMIT' && retries < maxRetries - 1) {
            console.log(`Rate limit hit, retrying after ${retryDelays[retries] / 1000} seconds...`);
            await delay(retryDelays[retries]);
            continue;
         }
         throw error;
      }
   }
   throw new Error('Max retries exceeded');
}

export async function updateVehicleData(): Promise<void> {
   try {
      const vehicles = await getAllVehicles();

      for (const vehicle of vehicles) {
         try {
            const token = await getValidAccessTokenByVehicle(vehicle.smart_car_id);
            const smartCarVehicle = new smartcar.Vehicle(vehicle.smart_car_id, token);

            const batchResponse = await retryWithBackoff(() =>
               smartCarVehicle.batch(['/location', '/odometer', '/battery'])
            );

            // Get location
            const location = await batchResponse.location();
            const address = await getAddressFromCoordinates(location.latitude, location.longitude);

            await updateVehicleDataInDb(
               vehicle.id,
               'location',
               {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  address: address
               },
               location.meta.fetchedAt,
               location.meta.dataAge
            );
            console.log('Location updated for vehicle', vehicle.id);

            // Get odometer
            const odometer = await batchResponse.odometer();
            await updateVehicleDataInDb(
               vehicle.id,
               'odometer',
               {
                  distance: odometer.distance,
                  unitSystem: odometer.meta.unitSystem
               },
               odometer.meta.fetchedAt,
               odometer.meta.dataAge
            );
            console.log('Odometer updated for vehicle', vehicle.id);

            // Get battery
            const batteryData = await batchResponse.battery();
            await updateVehicleDataInDb(
               vehicle.id,
               'battery',
               {
                  percentRemaining: batteryData.percentRemaining,
                  range: batteryData.range
               },
               batteryData.meta.fetchedAt,
               batteryData.meta.dataAge
            );
            console.log('Battery data updated for vehicle', vehicle.id);

         } catch (error) {
            console.error(`Failed to update data for vehicle ${vehicle.id}:`, error);
            await logError(vehicle.id, 'vehicle_data', error);
         }
         await delay(5000); // 5 second delay between vehicles
      }
   } catch (error) {
      console.error('Vehicle data update job failed:', error);
   }
}

async function getAllVehicles() {
   const { data, error } = await supabase
      .from('vehicles')
      .select('id, smart_car_id')
      .not('smart_car_id', 'is', null);

   if (error) throw error;
   return data;
} 