export interface VehicleDataError {
   id?: string;
   vehicle_id: string;
   feature_name: string;
   error_message: string;
   timestamp: string;
   retry_count: number;
   created_at?: string;
} 