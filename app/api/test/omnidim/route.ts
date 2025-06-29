import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.OMNIDIM_API_KEY || process.env.NEXT_PUBLIC_OMNIDIM_API_KEY || '';
    const baseUrl = process.env.OMNIDIM_BASE_URL || process.env.NEXT_PUBLIC_OMNIDIM_BASE_URL || '';
    
    // Check environment variables
    const environmentInfo = {
      apiKeyExists: !!apiKey,
      apiKeyFirstChars: apiKey ? apiKey.substring(0, 4) + '...' : 'not set',
      baseUrl: baseUrl,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    // Try to make a test request to the Omnidimension API
    let apiStatus = 'unknown';
    let apiResponse = null;
    
    if (apiKey) {
      try {
        const response = await fetch(`${baseUrl}/agents`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        apiStatus = response.ok ? 'OK' : `Error ${response.status}`;
        
        try {
          apiResponse = await response.json();
        } catch (e) {
          apiResponse = await response.text();
        }
      } catch (error) {
        apiStatus = `Request failed: ${error instanceof Error ? error.message : String(error)}`;
      }
    } else {
      apiStatus = 'No API key configured';
    }

    return NextResponse.json({
      status: 'success',
      environment: environmentInfo,
      apiTest: {
        status: apiStatus,
        response: apiResponse
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
