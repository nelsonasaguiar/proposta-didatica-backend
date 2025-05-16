import supabase from "./supabase.service";
1
export async function getVehicleById(id: string) {
   const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

   if (error) {
      throw new Error(error.message);
   }

   return data;
}

export async function updateVehicleSmartCarIdByVin(vin: string, vehicleId: string) {
   const { error } = await supabase
      .from('vehicles')
      .update({ smart_car_id: vehicleId })
      .eq('vin', vin);

   if (error) {
      throw new Error(error.message);
   }

   console.log('Updated vehicle in Supabase:', vin);
}