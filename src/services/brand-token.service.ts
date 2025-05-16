import { isPlateNumberFormat } from "../utils/main-utils";
import smartcarClient from "../helper/smartcar.helper";
import supabase from "./supabase.service";

async function getBrandToken(brand: string) {
   const { data, error } = await supabase
      .from('smart_car_tokens')
      .select('*')
      .eq('brand', brand)
      .single();
   if (error) throw error;
   return data;
}

async function updateBrandToken(brand: string, tokens: { accessToken: string, refreshToken: string, expiration: string, refreshExpiration: string }) {
   const { error } = await supabase
      .from('smart_car_tokens')
      .update({
         access_token: tokens.accessToken,
         refresh_token: tokens.refreshToken,
         expiration: tokens.expiration,
         refresh_expiration: tokens.refreshExpiration,
         updated_at: new Date().toISOString()
      })
      .eq('brand', brand);
   if (error) throw error;
}

async function getValidAccessTokenByBrand(brand: string) {
   let tokenData = await getBrandToken(brand);

   const now = new Date();
   // Ensure the database timestamp is treated as UTC by appending 'Z'
   const expirationDate = new Date(tokenData.expiration + 'Z');

   if (expirationDate < now) {
      // Token expired, refresh it
      const tokens = await smartcarClient.exchangeRefreshToken(tokenData.refresh_token);
      await updateBrandToken(brand, {
         accessToken: tokens.accessToken,
         refreshToken: tokens.refreshToken,
         expiration: tokens.expiration,
         refreshExpiration: tokens.refreshExpiration
      });
      return tokens.accessToken;
   }
   console.log('token is still valid');
   return tokenData.access_token;
}

// Add a function to find brand by vehicle ID
async function getBrandByVehicleId(vehicleId: string) {
   const { data, error } = await supabase
      .from('vehicles')
      .select('brand')
      .eq('smart_car_id', vehicleId)
      .single();
   if (error) throw error;
   return data.brand;
}

// Add a function to find brand by vehicle plate
async function getBrandByVehiclePlate(plate: string) {
   const { data, error } = await supabase
      .from('vehicles')
      .select('brand')
      .eq('plate_number', plate)
      .single();
   if (error) throw error;
   return data.brand;
}

// Modify getValidAccessToken to work with vehicle ID
async function getValidAccessTokenByVehicle(vehicleId: string) {
   const isPlateFormat = isPlateNumberFormat(vehicleId)
   console.log('isPlateFormat: ', isPlateFormat);
   const brand = isPlateFormat ? await getBrandByVehiclePlate(vehicleId) : await getBrandByVehicleId(vehicleId);

   console.log('brand: ', brand);

   if (!brand) {
      return null
   }

   return getValidAccessTokenByBrand(brand);
}

export { getValidAccessTokenByBrand, getValidAccessTokenByVehicle, updateBrandToken };