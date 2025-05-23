export interface SmartCarOdometerResponse {
   distance: number;
   meta: {
      dataAge: string;
      unitSystem: 'metric' | 'imperial';
      requestId: string;
      fetchedAt: string;
   };
}

export interface SmartCarChargeResponse {
   state: 'CHARGING' | 'NOT_CHARGING';
   isPluggedIn: boolean;
   meta: {
      dataAge: string;
      requestId: string;
      fetchedAt: string;
   };
}

export interface SmartCarBatteryResponse {
   range: number;
   percentRemaining: number;
   meta: {
      dataAge: string;
      unitSystem: 'metric' | 'imperial';
      requestId: string;
      fetchedAt: string;
   };
}

export interface SmartCarLocationResponse {
   latitude: number;
   longitude: number;
   meta: {
      dataAge: string;
      requestId: string;
      fetchedAt: string;
   };
}

export interface SmartCarBatteryCapacityResponse {
   availableCapacities: Array<{
      capacity: number;
      description: string | null;
   }>;
   capacity: {
      nominal: number;
      source: 'SMARTCAR' | 'USER_SELECTED';
   } | null;
   url: string | null;
   meta: {
      dataAge: string;
      requestId: string;
      fetchedAt: string;
   };
}

export interface SmartCarChargeLimitResponse {
   status: 'success';
   message: string;
   meta: {
      dataAge: string;
      requestId: string;
      fetchedAt: string;
   };
}

export interface SmartCarChargeControlResponse {
   status: 'success';
   message: string;
   meta: {
      dataAge: string;
      requestId: string;
      fetchedAt: string;
   };
}

export interface SmartCarSystemStatusResponse {
   systems: Array<{
      systemID: string;
      status: 'OK' | 'ALERT';
      description: string | null;
   }>;
   meta: {
      dataAge: string;
      requestId: string;
      fetchedAt: string;
   };
}

export interface SmartCarTirePressureResponse {
   frontLeft: number;
   frontRight: number;
   backLeft: number;
   backRight: number;
   meta: {
      dataAge: string;
      unitSystem: 'metric' | 'imperial';
      requestId: string;
      fetchedAt: string;
   };
}

export interface SmartCarBatchResponse {
   responses: Array<{
      path: string;
      body: any;
      code: number;
      headers: {
         'sc-data-age'?: string;
         'sc-unit-system'?: 'metric' | 'imperial';
         [key: string]: string | undefined;
      };
   }>;
}
