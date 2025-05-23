export interface VehicleDataHistory {
   id?: string;
   vehicle_id: string;
   feature_name: string;
   feature_data: {
      value: any;
      fetched_at: string;
      data_age: string;
   };
   created_at?: string;
} 