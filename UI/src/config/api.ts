// API Configuration
const getApiBaseUrl = (): string => {
  // Check if we're in production mode
  const isProduction = import.meta.env.PROD;
  
  // Get the environment variable
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  
  // If environment variable is set, use it
  if (envApiUrl) {
    return envApiUrl;
  }
  
  // Fallback logic
  if (isProduction) {
    // In production, try to detect the current domain
    if (typeof window !== 'undefined') {
      const { protocol, hostname } = window.location;
      // Assume API is on same domain but different port or path
      return `${protocol}//${hostname}:3000`;
    }
    // Server-side fallback
    return 'https://your-production-api-domain.com';
  }
  
  // Development fallback
  return 'http://localhost:3000';
};

export const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;