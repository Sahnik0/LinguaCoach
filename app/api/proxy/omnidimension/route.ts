import { NextRequest, NextResponse } from 'next/server';

// Route handlers are always executed on the server, so it's safe to access
// non-NEXT_PUBLIC_ environment variables here
const OMNIDIM_API_KEY = process.env.OMNIDIM_API_KEY || "";
const OMNIDIM_BASE_URL = process.env.OMNIDIM_BASE_URL || "https://backend.omnidim.io/api/v1";

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
    
    console.log(`Proxying GET request to: ${targetUrl}`);
    
    // Check if we have API key configured
    if (!OMNIDIM_API_KEY) {
      console.error("Missing OMNIDIM_API_KEY in environment variables");
      return NextResponse.json(
        { error: "API configuration error - missing API key" }, 
        { status: 500 }
      );
    }
    
    // Forward the request to the Omnidimension API
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OMNIDIM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

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
    
    console.log(`Proxying POST request to: ${targetUrl}`);

    // Check if we have API key configured
    if (!OMNIDIM_API_KEY) {
      console.error("Missing OMNIDIM_API_KEY in environment variables");
      return NextResponse.json(
        { error: "API configuration error - missing API key" }, 
        { status: 500 }
      );
    }

    // Forward the request to the Omnidimension API
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OMNIDIM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

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
