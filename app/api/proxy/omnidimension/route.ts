import { NextRequest, NextResponse } from 'next/server';

const OMNIDIM_API_KEY = process.env.OMNIDIM_API_KEY || "";
const OMNIDIM_BASE_URL = process.env.OMNIDIM_BASE_URL || "https://backend.omnidim.io/api/v1";

/**
 * Proxy handler for Omnidimension API calls to avoid CORS issues
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
    
    // Forward the request to the Omnidimension API
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OMNIDIM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    // Get the response data
    const data = await response.json();

    // Return the response from the proxy
    return NextResponse.json(data, { status: response.status });
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
    const body = await request.json();
    
    // Build the full URL to the Omnidimension API
    const targetUrl = `${OMNIDIM_BASE_URL}/${endpoint}`;
    
    console.log(`Proxying POST request to: ${targetUrl}`);

    // Forward the request to the Omnidimension API
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OMNIDIM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Get the response data
    const data = await response.json();

    // Return the response from the proxy
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
