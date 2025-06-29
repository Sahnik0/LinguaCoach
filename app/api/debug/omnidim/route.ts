import { NextResponse } from 'next/server';

/**
 * Debug endpoint for Omnidimension API
 * This provides detailed diagnostics for Omnidimension API connectivity
 */
export async function GET() {
  try {
    // API key and base URL check
    const apiKey = process.env.OMNIDIM_API_KEY || process.env.NEXT_PUBLIC_OMNIDIM_API_KEY || '';
    const baseUrl = process.env.OMNIDIM_BASE_URL || process.env.NEXT_PUBLIC_OMNIDIM_BASE_URL || 'https://backend.omnidim.io/api/v1';
    
    // Basic configuration check
    const configStatus = {
      apiKeyConfigured: !!apiKey,
      baseUrlConfigured: !!baseUrl,
      actualBaseUrl: baseUrl,
    };
    
    // Try a test request to verify actual connectivity
    let connectivityStatus = 'unknown';
    let apiResponse = null;
    let errorDetails = null;
    
    if (apiKey) {
      try {
        // Set up a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        console.log(`[Debug] Testing Omnidimension API connectivity to ${baseUrl}/agents`);
        
        // Make a simple request to the agents endpoint
        const response = await fetch(`${baseUrl}/agents`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Process the response
        connectivityStatus = response.ok ? 'connected' : `error_${response.status}`;
        
        if (response.ok) {
          try {
            // Try to parse JSON response
            const data = await response.json();
            apiResponse = {
              type: 'json',
              data: Array.isArray(data) ? `Array with ${data.length} items` : 'Object'
            };
          } catch (parseError) {
            // Fall back to text if not JSON
            const text = await response.text();
            apiResponse = {
              type: 'text',
              data: text.substring(0, 500) + (text.length > 500 ? '...' : '')
            };
          }
        } else {
          // For error responses
          try {
            const errorText = await response.text();
            errorDetails = {
              status: response.status,
              statusText: response.statusText,
              body: errorText.substring(0, 500) + (errorText.length > 500 ? '...' : '')
            };
          } catch (textError) {
            errorDetails = {
              status: response.status,
              statusText: response.statusText,
              body: 'Could not read response body'
            };
          }
        }
      } catch (error) {
        // Handle fetch errors
        connectivityStatus = 'failed';
        errorDetails = {
          type: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
        };
        
        console.error('[Debug] Omnidimension API test failed:', error);
      }
    } else {
      connectivityStatus = 'missing_api_key';
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      config: configStatus,
      connectivity: {
        status: connectivityStatus,
        response: apiResponse,
        error: errorDetails
      },
      recommendations: getRecommendations(connectivityStatus, errorDetails)
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Generate troubleshooting recommendations based on test results
 */
function getRecommendations(status: string, errorDetails: any) {
  const recommendations = [];
  
  if (status === 'missing_api_key') {
    recommendations.push('Add OMNIDIM_API_KEY to your .env.local file');
    recommendations.push('For client-side access, also add NEXT_PUBLIC_OMNIDIM_API_KEY with the same value');
  }
  else if (status === 'failed') {
    recommendations.push('Check if the Omnidimension API service is available');
    recommendations.push('Verify your internet connectivity');
    recommendations.push('Check if your API endpoint URL is correct');
    
    // Add more specific recommendations based on error type
    if (errorDetails?.type === 'AbortError') {
      recommendations.push('The request timed out - the API service might be slow or unresponsive');
    }
    else if (errorDetails?.message?.includes('ENOTFOUND')) {
      recommendations.push('DNS resolution failed - check if the API domain is correct');
    }
  }
  else if (status?.startsWith('error_')) {
    const errorCode = status.split('_')[1];
    
    if (errorCode === '401') {
      recommendations.push('Your API key is invalid or expired');
      recommendations.push('Generate a new API key from the Omnidimension dashboard');
    }
    else if (errorCode === '403') {
      recommendations.push('Your API key doesn\'t have permission for this operation');
      recommendations.push('Check the access rights for your API key');
    }
    else if (errorCode === '404') {
      recommendations.push('The API endpoint was not found');
      recommendations.push('Verify that the API base URL is correct');
    }
    else if (errorCode === '429') {
      recommendations.push('You\'re hitting rate limits');
      recommendations.push('Reduce the frequency of your API calls');
    }
    else if (errorCode.startsWith('5')) {
      recommendations.push('The API service is experiencing server-side issues');
      recommendations.push('Wait and try again later');
    }
  }
  else if (status === 'connected') {
    recommendations.push('API connection is working correctly');
    recommendations.push('If you\'re still experiencing issues, check request payload format');
  }
  
  // General recommendations
  recommendations.push('Use the health check endpoint (/api/health) to verify overall system status');
  recommendations.push('Check server logs for detailed error information');
  
  return recommendations;
}
