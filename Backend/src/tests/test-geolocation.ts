// Test script for IP geolocation functionality
// Run with: npx ts-node src/tests/test-geolocation.ts

import { getIPGeolocation, parseUserAgent } from '../services/geolocation';

async function testGeolocation() {
  console.log('Testing IP Geolocation Service...\n');
  
  // Test with Google DNS IP
  const testIP = '8.8.8.8';
  console.log(`Testing IP: ${testIP}`);
  
  try {
    const result = await getIPGeolocation(testIP);
    console.log('Geolocation Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
  
  console.log('\nTesting User Agent Parsing...');
  const testUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const userAgentResult = parseUserAgent(testUserAgent);
  console.log('User Agent Result:', JSON.stringify(userAgentResult, null, 2));
}

testGeolocation();