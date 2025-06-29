# CORS Issue Solution for Language Coach App

This document describes how we solved the CORS (Cross-Origin Resource Sharing) issue when calling the Omnidimension API from the browser.

## The Problem

When making requests directly from the browser to the Omnidimension API (`https://backend.omnidim.io/api/v1/`), you encountered CORS errors like this:

```
Access to fetch at 'https://backend.omnidim.io/api/v1/agents' from origin 'http://localhost:3000' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the 
requested resource.
```

This happens because the Omnidimension API server doesn't include the necessary CORS headers to allow requests from your application's origin.

## The Solution

We implemented a proxy server within your Next.js application that forwards requests to the Omnidimension API server. Since CORS is a browser security mechanism, server-to-server requests are not affected by it.

### How It Works

1. **Frontend Requests**: Instead of calling the Omnidimension API directly, your frontend code now calls a local Next.js API route like `/api/proxy/omnidimension?endpoint=agents`.

2. **Proxy Server**: This Next.js API route receives the request, adds the proper authentication headers, and forwards it to the actual Omnidimension API endpoint.

3. **Response Handling**: The proxy receives the response from Omnidimension and forwards it back to your frontend.

### Implementation Details

1. Created a Next.js API route at `/app/api/proxy/omnidimension/route.ts` that:
   - Receives requests from the frontend
   - Extracts the endpoint parameter
   - Forwards the request to Omnidimension with proper authentication
   - Returns the response to the frontend

2. Modified `lib/omnidimension.ts` to:
   - Use the proxy when running in the browser environment
   - Use direct API calls when running on the server

## Usage

The changes were made transparently - all existing code using the Omnidimension API will continue to work without modification. The API class automatically detects whether it's running in the browser or on the server and chooses the appropriate request method.

## Alternative Solutions

If you prefer not to use a proxy, there are two other potential solutions:

1. **Ask Omnidimension to Enable CORS**: Contact Omnidimension support and request that they add your domain to their CORS allowed origins.

2. **Use a Browser Extension**: For local development only, you could use a browser extension like "CORS Unblock" to bypass CORS restrictions. Note that this is not a solution for production.

## Security Considerations

Using a proxy means your API key is never exposed in the browser, which is more secure. The key remains safely on your server.
