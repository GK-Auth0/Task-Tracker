export interface IPInfoResponse {
  ip: string;
  country: string;
  region: string;
  city: string;
  timezone: string;
  loc: string;
}

export interface GeolocationData {
  ip_address: string;
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  lat?: number;
  lng?: number;
}
