import axios from 'axios';

interface GeocodingResponse {
   display_name: string;
   address: {
      house_number?: string;
      road?: string;
      suburb?: string;
      city?: string;
      state?: string;
      country?: string;
      postcode?: string;
   };
}

export async function getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
   try {
      const response = await axios.get<GeocodingResponse>(
         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
         {
            headers: {
               'User-Agent': 'PropostaDidatica/1.0'
            }
         }
      );

      const { address } = response.data;
      const addressParts = [
         address.house_number,
         address.road,
         address.suburb,
         address.city,
         address.state,
         address.postcode,
         address.country
      ].filter(Boolean);

      return addressParts.join(', ');
   } catch (error) {
      console.error('Error getting address from coordinates:', error);
      throw new Error('Failed to get address from coordinates');
   }
} 