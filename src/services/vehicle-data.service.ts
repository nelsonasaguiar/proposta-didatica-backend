import supabase from './supabase.service';
import { VehicleDataHistory } from '../models/vehicle-data-history.model';
import { VehicleDataError } from '../models/vehicle-data-error.model';
import { getVehicleBySmartCarId } from './vehicle.service';

export async function updateVehicleData(
   vehicleId: string,
   featureName: string,
   data: any,
   fetchedAt: string,
   dataAge: string,
   idIsSmartCarId: boolean = false
): Promise<void> {
   try {
      if (idIsSmartCarId) {
         const vehicle = await getVehicleBySmartCarId(vehicleId);
         vehicleId = vehicle.id;
      }

      // Update latest data in vehicles table
      const { error: updateError } = await supabase
         .from('vehicles')
         .update({
            latest_car_data: {
               ...(await getCurrentLatestData(vehicleId)),
               [featureName]: {
                  ...data,
                  fetched_at: fetchedAt,
                  data_age: dataAge
               }
            }
         })
         .eq('id', vehicleId);

      if (updateError) throw updateError;

      // Store in history
      const historyData: VehicleDataHistory = {
         vehicle_id: vehicleId,
         feature_name: featureName,
         feature_data: {
            value: data,
            fetched_at: fetchedAt,
            data_age: dataAge
         }
      };

      const { error: historyError } = await supabase
         .from('vehicle_data_history')
         .insert(historyData);

      if (historyError) throw historyError;
   } catch (error) {
      console.error(`Error updating vehicle data for ${featureName}:`, error);
      await logError(vehicleId, featureName, error);
      throw error;
   }
}

async function getCurrentLatestData(vehicleId: string): Promise<any> {
   const { data, error } = await supabase
      .from('vehicles')
      .select('latest_car_data')
      .eq('id', vehicleId)
      .single();

   if (error) throw error;
   return data?.latest_car_data || {};
}

export async function logError(
   vehicleId: string,
   featureName: string,
   error: any
): Promise<void> {
   const errorData: VehicleDataError = {
      vehicle_id: vehicleId,
      feature_name: featureName,
      error_message: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      retry_count: 0
   };

   const { error: insertError } = await supabase
      .from('vehicle_data_errors')
      .insert(errorData);

   if (insertError) {
      console.error('Failed to log error:', insertError);
   }
} 