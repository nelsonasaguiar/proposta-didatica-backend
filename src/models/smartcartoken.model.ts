export interface SmartCarToken {
   accessToken: string;
   refreshToken: string;
   expiration: string; // ISO date string
   refreshExpiration: string; // ISO date string
}