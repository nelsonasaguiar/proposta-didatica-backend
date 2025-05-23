declare module 'smartcar' {
   export class Vehicle {
      constructor(id: string, token: string);
      odometer(): Promise<{
         value: number;
         meta: {
            fetchedAt: string;
            dataAge: string;
         };
      }>;
      battery(): Promise<{
         percentRemaining: number;
         range: number;
         meta: {
            fetchedAt: string;
            dataAge: string;
         };
      }>;
      tirePressure(): Promise<{
         frontLeft: number;
         frontRight: number;
         backLeft: number;
         backRight: number;
         meta: {
            fetchedAt: string;
            dataAge: string;
         };
      }>;
      diagnosticSystemStatus(): Promise<{
         systems: Array<{
            systemID: string;
            status: 'OK' | 'ALERT';
            description: string | null;
         }>;
         meta: {
            fetchedAt: string;
            dataAge: string;
         };
      }>;
      location(): Promise<{
         latitude: number;
         longitude: number;
         meta: {
            fetchedAt: string;
            dataAge: string;
         };
      }>;
      batch(paths: string[]): Promise<{
         [key: string]: () => Promise<any>;
      }>;
   }
} 