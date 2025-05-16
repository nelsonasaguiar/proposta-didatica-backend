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

export async function getSmartCarIdByPlate(plate: string): Promise<string | null> {
   const { data, error } = await supabase
      .from('vehicles')
      .select('smart_car_id')
      .eq('plate_number', plate)
      .single();

   if (error) {
      throw new Error(error.message);
   }

   return data ? data.smart_car_id : null;
}

export async function getVehicleBySmartCarId(id: string) {
   const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('smart_car_id', id)
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