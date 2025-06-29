# Omnidimension API Integration Debugging Guide

This document provides instructions for debugging issues with the Omnidimension API integration in the Language Coach App.

## Common Issues

### 1. System Falls Back to Demo Mode

If the app is consistently falling back to demo mode instead of making real calls, check the following:

#### Environment Variables

Ensure the environment variables are correctly set in `.env.local`:
```
NEXT_PUBLIC_OMNIDIM_API_KEY=your_api_key_here
NEXT_PUBLIC_OMNIDIM_BASE_URL=https://backend.omnidim.io/api/v1
OMNIDIM_API_KEY=your_api_key_here
OMNIDIM_BASE_URL=https://backend.omnidim.io/api/v1
```

Having both NEXT_PUBLIC_ and regular variables ensures they work in both client and server contexts.

#### API Key Validation

Make sure your API key is valid. You can test it with the API test endpoint:
```
GET /api/test/omnidim
```

#### Proxy Configuration

Check if the proxy is correctly handling requests by looking at server logs for lines that start with `[Proxy]`.

### 2. Phone Number Format

The phone number must:
- Include the country code with a + prefix (e.g., +15551234567)
- Have no spaces, dashes, or other formatting characters
- Match the regex pattern: `/^\+\d{1,3}\d{10,}$/`

### 3. Network Issues

- Check for CORS errors in the browser console
- Ensure the proxy is correctly forwarding requests
- Look for timeout errors which might indicate network connectivity issues

## Debugging Steps

1. **Check Environment Variables**
   - Verify that both NEXT_PUBLIC_OMNIDIM_API_KEY and OMNIDIM_API_KEY are set
   - Restart the development server after changes

2. **Test API Connection**
   - Visit `/api/test/omnidim` in your browser to verify API connectivity
   - Check the response for API key validity and connection status

3. **Review Console Logs**
   - Look for logs from the OmnidimensionAPI class
   - Check for validation messages about phone number format
   - Verify that the API service availability check is passing

4. **Examine Network Requests**
   - In browser developer tools, monitor Network tab for requests to `/api/proxy/omnidimension`
   - Check response status codes and bodies for error messages

5. **Verify Proxy Operation**
   - Look for `[Proxy]` prefixed logs in the server console
   - Ensure proxy is correctly forwarding the API key and receiving responses

## Resolving Common Issues

### API Key Not Being Sent
- Check if the key is correctly loaded from environment variables
- Verify the proxy is adding the Authorization header

### Phone Number Format Issues
- Ensure the phone number includes the country code
- Verify the phone number validation is passing in both client and server

### Agent Creation Failure
- Check if the agent list endpoint is working
- Verify permissions to create new agents

### Fallback to Demo Mode
- Check console for specific errors that trigger the fallback
- Ensure API service availability check is passing

### Timeouts or Network Errors
- Increase timeout values if network latency is high
- Check if the API service is operational

## Testing Real Calls

To confirm the system is making real calls:

1. Use a test phone number that you can answer
2. Check console logs for successful API responses
3. Verify that the phone actually rings
4. Monitor call status updates in the UI
