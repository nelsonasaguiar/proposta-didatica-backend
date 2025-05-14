export enum VehicleStatus {
   AVAILABLE = 'available',
   IN_USE = 'in_use',
   MAINTENANCE = 'maintenance',
   CHARGING = 'charging'
}

export enum Brand {
   SKODA = 'skoda',
   AUDI = 'audi',
   MERCEDES = 'mercedes',
   TESLA = 'tesla',
   VOLKSWAGEN = 'volkswagen'
}

export interface Vehicle {
   id?: string;
   plate_number: string;
   model?: string;
   status?: VehicleStatus;
   company_id?: string;
   is_pool?: boolean;
   kwh_capacity?: number;
   brand: Brand;
}