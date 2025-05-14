import smartcarClient from "./smartcar.service";
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

async function getValidAccessToken(brand: string) {
   let tokenData = await getBrandToken(brand);

   console.log('token data: ', tokenData);

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
   return tokenData.access_token;
}

export default getValidAccessToken