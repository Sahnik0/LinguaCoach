import { NextRequest, NextResponse } from 'next/server';

// Route handlers are always executed on the server, so it's safe to access
// non-NEXT_PUBLIC_ environment variables here
const OMNIDIM_API_KEY = process.env.OMNIDIM_API_KEY || process.env.NEXT_PUBLIC_OMNIDIM_API_KEY || "";
const OMNIDIM_BASE_URL = process.env.OMNIDIM_BASE_URL || process.env.NEXT_PUBLIC_OMNIDIM_BASE_URL || "https://backend.omnidim.io/api/v1";

// Log environment info on startup to help with debugging render issues
console.log(`[Proxy] Starting up with API URL: ${OMNIDIM_BASE_URL}`);
console.log(`[Proxy] API key configured: ${!!OMNIDIM_API_KEY}`);
console.log(`[Proxy] Node environment: ${process.env.NODE_ENV}`);

/**
 * Helper function to safely log errors
 */
function logError(message: string, error: unknown) {
  console.error(`[Proxy ERROR] ${message}`);
  if (error instanceof Error) {
    console.error(`[Proxy ERROR] ${error.name}: ${error.message}`);
    if (error.stack) {
      console.error(`[Proxy ERROR] Stack: ${error.stack}`);
    }
  } else {
    console.error(`[Proxy ERROR] Unknown error type:`, error);
  }
}

/**
 * Proxy handler for Omnidimension API calls to avoid CORS issues
 * This is a server-side API route that forwards requests to the Omnidimension API
 */
export async function GET(request: NextRequest) {
  try {
    // Extract the endpoint path from the request URL
    const url = new URL(request.url);
    const endpoint = url.searchParams.get('endpoint');
    
    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint parameter" }, { status: 400 });
    }

    // Build the full URL to the Omnidimension API
    const targetUrl = `${OMNIDIM_BASE_URL}/${endpoint}`;
    
    console.log(`[Proxy] Proxying GET request to: ${targetUrl}`);
    
    // Check if we have API key configured
    if (!OMNIDIM_API_KEY) {
      console.error("[Proxy] Missing OMNIDIM_API_KEY in environment variables. Check your .env.local file.");
      return NextResponse.json(
        { error: "API configuration error - missing API key", details: "Check server environment variables" }, 
        { status: 500 }
      );
    }
    
    // Log headers that will be sent for debugging
    console.log(`[Proxy] Using API Key: ${OMNIDIM_API_KEY.substring(0, 5)}...`)
    
    // Set up a timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout
    
    // Forward the request to the Omnidimension API with proper error handling
    let response;
    try {
      console.log(`[Proxy] Sending GET request to ${targetUrl}`);
      response = await fetch(targetUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${OMNIDIM_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        // Add cache control to prevent stale responses
        cache: 'no-store'
      });
      
      console.log(`[Proxy] Response status: ${response.status} ${response.statusText}`);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Handle specific fetch errors
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          logError(`Request to ${targetUrl} timed out after 15 seconds`, fetchError);
          return NextResponse.json({ 
            error: "External API request timed out", 
            details: "The request to the voice service took too long to respond" 
          }, { status: 504 });
        } else {
          logError(`Fetch error for ${targetUrl}`, fetchError);
          return NextResponse.json({ 
            error: "Failed to contact external API", 
            details: fetchError instanceof Error ? fetchError.message : "Unknown error" 
          }, { status: 502 });
        }
      }
      
      logError(`Unknown fetch error for ${targetUrl}`, fetchError);
      return NextResponse.json({ error: "Failed to contact external API" }, { status: 502 });
    } finally {
      clearTimeout(timeoutId);
    }

    // Check if the response is successful
    if (!response.ok) {
      console.error(`Error response from API: ${response.status} ${response.statusText}`);
      // Try to return error information safely
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          return NextResponse.json(errorData, { status: response.status });
        } else {
          const errorText = await response.text();
          return new NextResponse(errorText, { 
            status: response.status,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      } catch (parseError) {
        return NextResponse.json(
          { error: `API returned ${response.status} ${response.statusText}` }, 
          { status: response.status }
        );
      }
    }
    
    // Try to parse the response properly
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
      } else {
        const text = await response.text();
        return new NextResponse(text, { 
          status: response.status,
          headers: { 'Content-Type': contentType || 'text/plain' }
        });
      }
    } catch (parseError) {
      console.error("Error parsing API response:", parseError);
      const text = await response.text();
      return new NextResponse(text, { 
        status: response.status,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * Proxy handler for POST requests to Omnidimension API
 */
export async function POST(request: NextRequest) {
  try {
    // Extract the endpoint and body from the request
    const url = new URL(request.url);
    const endpoint = url.searchParams.get('endpoint');
    
    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint parameter" }, { status: 400 });
    }

    // Parse the request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    // Build the full URL to the Omnidimension API
    const targetUrl = `${OMNIDIM_BASE_URL}/${endpoint}`;
    
    console.log(`[Proxy] Proxying POST request to: ${targetUrl}`);
    
    // Special handling and logging for calls/dispatch endpoint
    if (endpoint.includes('calls/dispatch')) {
      console.log(`[Proxy] Call dispatch request detected - payload:`, JSON.stringify(body));
      
      // Check phone number format
      if (body.to_number) {
        const phoneRegex = /^\+\d{1,3}\d{10,}$/;
        if (!phoneRegex.test(body.to_number)) {
          console.warn(`[Proxy] Warning: Phone number format may be invalid: ${body.to_number}`);
        } else {
          console.log(`[Proxy] Phone number format looks valid: ${body.to_number}`);
        }
      } else {
        console.error(`[Proxy] Error: Missing to_number in call dispatch request`);
      }
    }

    // Check if we have API key configured
    if (!OMNIDIM_API_KEY) {
      console.error("[Proxy] Missing OMNIDIM_API_KEY in environment variables");
      return NextResponse.json(
        { error: "API configuration error - missing API key", details: "Check server environment variables" }, 
        { status: 500 }
      );
    }
    
    // Log API key presence for debugging
    console.log(`[Proxy] Using API Key: ${OMNIDIM_API_KEY.substring(0, 5)}...`)

    // Set up a timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20-second timeout for POST requests

    // Forward the request to the Omnidimension API with enhanced error handling
    let response;
    try {
      console.log(`[Proxy] Sending POST request to ${targetUrl} with body:`, JSON.stringify(body).substring(0, 200) + (JSON.stringify(body).length > 200 ? '...' : ''));
      
      response = await fetch(targetUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${OMNIDIM_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      console.log(`[Proxy] POST response status: ${response.status} ${response.statusText}`);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Handle specific fetch errors with detailed logging
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          logError(`POST request to ${targetUrl} timed out after 20 seconds`, fetchError);
          return NextResponse.json({ 
            error: "External API request timed out", 
            details: "The voice service took too long to respond. This could be due to high service load or network issues."
          }, { status: 504 });
        } else {
          logError(`POST fetch error for ${targetUrl}`, fetchError);
          return NextResponse.json({ 
            error: "Failed to contact external API", 
            details: fetchError instanceof Error ? fetchError.message : "Unknown error"
          }, { status: 502 });
        }
      }
      
      logError(`Unknown POST fetch error for ${targetUrl}`, fetchError);
      return NextResponse.json({ 
        error: "Failed to contact external API", 
        details: "An unexpected error occurred when contacting the voice service" 
      }, { status: 502 });
    } finally {
      clearTimeout(timeoutId);
    }

    // Check if the response is successful
    if (!response.ok) {
      console.error(`Error response from API: ${response.status} ${response.statusText}`);
      // Try to return error information safely
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          return NextResponse.json(errorData, { status: response.status });
        } else {
          const errorText = await response.text();
          return new NextResponse(errorText, { 
            status: response.status,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      } catch (parseError) {
        return NextResponse.json(
          { error: `API returned ${response.status} ${response.statusText}` }, 
          { status: response.status }
        );
      }
    }
    
    // Try to parse the response properly
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
      } else {
        const text = await response.text();
        return new NextResponse(text, { 
          status: response.status,
          headers: { 'Content-Type': contentType || 'text/plain' }
        });
      }
    } catch (parseError) {
      console.error("Error parsing API response:", parseError);
      const text = await response.text();
      return new NextResponse(text, { 
        status: response.status,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
