# Fix for 503 Bad Gateway on Render

If you're seeing a 503 Bad Gateway error with message:

```
503 Bad Gateway
Request ID: 957690c3ca95f908-PDX
This service is currently unavailable. Please try again in a few minutes.
```

Follow these steps to diagnose and fix the issue:

## Immediate Actions

1. **Check Render Dashboard**:
   - Log in to your Render dashboard and check service status
   - Look for crash reports or failed deployments
   - Review recent logs for error messages

2. **Test API Connectivity**:
   - Access your service's `/api/health` endpoint to check overall status
   - Access your service's `/api/debug/omnidim` endpoint to check API connectivity specifically
   - Note any errors or connectivity issues

3. **Restart Your Service**:
   - In the Render dashboard, click "Manual Deploy" and select "Clear build cache & deploy"
   - Monitor the deployment logs carefully

## Common Issues and Solutions

### 1. API Connectivity Issues

If the `/api/debug/omnidim` endpoint shows connectivity issues:

- Verify your API key is correct
- Check if the Omnidimension API service is operational
- Make sure your environment variables are set correctly

```bash
# Add these environment variables in Render dashboard
OMNIDIM_API_KEY=your_api_key_here
OMNIDIM_BASE_URL=https://backend.omnidim.io/api/v1
NEXT_PUBLIC_OMNIDIM_API_KEY=your_api_key_here
NEXT_PUBLIC_OMNIDIM_BASE_URL=https://backend.omnidim.io/api/v1
```

### 2. Resource Limits

If your service is running out of resources:

- Check memory usage in the Render dashboard
- Consider upgrading your Render service plan
- Optimize your application to use fewer resources

### 3. Deployment Issues

If the service is failing during deployment:

- Check build logs for errors
- Make sure all dependencies are correctly specified
- Verify that your Node.js version is compatible with your dependencies

### 4. Proxy Configuration Issues

If API calls are failing but the API itself is operational:

- Make sure your proxy implementation is correct
- Check for CORS configuration issues
- Verify that timeout values are appropriate

## Recent Code Changes

We've made several improvements to help with debugging and reliability:

1. **Enhanced Error Logging**:
   - Added detailed error logging throughout the application
   - Improved proxy error handling with specific status codes

2. **New Diagnostic Endpoints**:
   - `/api/health` - Checks overall application health
   - `/api/debug/omnidim` - Specifically tests Omnidimension API connectivity

3. **Improved Timeouts and Error Recovery**:
   - Added proper request timeouts to prevent hanging requests
   - Added graceful error handling for network issues

4. **Environment Variable Fallbacks**:
   - Now checking both `OMNIDIM_API_KEY` and `NEXT_PUBLIC_OMNIDIM_API_KEY`
   - Added fallbacks for critical configuration

## Next Steps After Fixing

1. **Monitor Your Application**:
   - Keep an eye on logs for recurring errors
   - Watch for any memory leaks or resource usage spikes

2. **Implement Health Checks in Render**:
   - Configure Render to use your `/api/health` endpoint as a health check
   - This can help prevent 503 errors by automatically restarting unhealthy services

3. **Consider Adding Alerts**:
   - Set up monitoring to alert you if your service goes down
   - Configure logging to capture critical errors

## Contact Support

If you've tried all the above steps and are still experiencing issues:

1. Gather your logs and error information
2. Note the Request ID from the 503 error message
3. Contact Render support with these details
