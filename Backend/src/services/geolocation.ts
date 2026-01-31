import axios from 'axios';

interface IPInfoResponse {
  ip: string;
  country: string;
  region: string;
  city: string;
  timezone: string;
  loc: string; // "lat,lng" format
}

interface GeolocationData {
  ip_address: string;
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  lat?: number;
  lng?: number;
}

export const getIPGeolocation = async (ip: string): Promise<GeolocationData> => {
  try {
    const token = process.env.IPINFO_TOKEN || '2fcbfaa89132ad';
    const response = await axios.get<IPInfoResponse>(
      `https://ipinfo.io/${ip}?token=${token}`,
      { timeout: 5000 }
    );

    const data = response.data;
    const [lat, lng] = data.loc ? data.loc.split(',').map(Number) : [null, null];

    return {
      ip_address: ip,
      country: data.country,
      region: data.region,
      city: data.city,
      timezone: data.timezone,
      lat: lat || undefined,
      lng: lng || undefined,
    };
  } catch (error) {
    console.error('Failed to get IP geolocation:', error);
    return { ip_address: ip };
  }
};

export const parseUserAgent = (userAgent: string) => {
  const browser = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[0] || 'Unknown';
  const os = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/)?.[0] || 'Unknown';
  const device = userAgent.includes('Mobile') ? 'Mobile' : 'Desktop';
  
  return { browser, os, device };
};