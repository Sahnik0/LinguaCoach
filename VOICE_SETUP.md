# Voice Service Setup Guide

This document explains how to configure real voice services for the Language Coach App to enable actual phone calls instead of demo mode.

## Current Status

By default, the app uses the OmniDimension API which requires proper authentication. Without valid API credentials, the app automatically falls back to demo mode, which simulates phone calls for demonstration purposes.

## Setting Up Real Voice Services

### Option 1: OmniDimension API (Primary)

The app is configured to use the OmniDimension API for real voice calls.

1. **Get your API credentials** from OmniDimension
2. **Add to your `.env.local`**:
   ```bash
   OMNIDIM_API_KEY=your_api_key_here
   OMNIDIM_BASE_URL=https://backend.omnidim.io/api/v1
   ```

**Phone Number Format**: Phone numbers must include the country code (e.g., +15551234567) as required by the OmniDimension API.

### Option 2: Twilio Voice (Alternative)

Twilio is a reliable, well-documented voice API service.

1. **Sign up for Twilio**: https://www.twilio.com/
2. **Get your credentials** from the Twilio Console:
   - Account SID
   - Auth Token
3. **Add to your `.env.local`**:
   ```bash
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   ```

**Note**: Implementation for Twilio integration is prepared but needs to be completed in `lib/omnidimension.ts`.

### Option 2: Vapi.ai

Vapi.ai specializes in AI voice assistants.

1. **Sign up for Vapi.ai**: https://vapi.ai/
2. **Get your API key** from the dashboard
3. **Add to your `.env.local`**:
   ```bash
   VAPI_API_KEY=your_vapi_api_key_here
   ```

**Note**: Implementation for Vapi.ai integration is prepared but needs to be completed in `lib/omnidimension.ts`.

### Option 3: Custom Voice Service

If you have your own voice API service:

1. **Update your `.env.local`**:
   ```bash
   OMNIDIMENSION_API_KEY=your_custom_api_key
   OMNIDIMENSION_BASE_URL=https://your-voice-api.com/v1
   ```

2. **Ensure your API endpoints match** the expected format in `lib/omnidimension.ts`:
   - `POST /calls/initiate` - Start a call
   - `GET /calls/{id}/status` - Check call status
   - `GET /calls/{id}/analysis` - Get call analysis
   - `POST /calls/{id}/end` - End a call
   - `POST /chat/message` - Send chat message

## Implementation Notes

### Current Implementation

The `OmnidimensionAPI` class in `lib/omnidimension.ts` includes:

- ✅ Better error handling with timeouts
- ✅ Graceful fallback to demo mode
- ✅ Clear error messages for different failure types
- ✅ Service availability checking
- ⚠️ Placeholder configuration for real services (needs implementation)

### To Complete Real Voice Integration

1. **Implement real service adapters** in `lib/omnidimension.ts`:
   - Add Twilio Voice API integration
   - Add Vapi.ai API integration
   - Update the `checkRealVoiceServices()` method

2. **Update API endpoint mapping** to match your chosen service's API structure

3. **Test with real phone numbers** in a development environment

## Demo Mode

When no real voice service is configured or available, the app automatically uses demo mode:

- ✅ Simulates realistic call flow
- ✅ Provides mock analysis and feedback
- ✅ Demonstrates all app features
- ✅ Saves demo sessions to Firebase
- ✅ Uses Groq AI for realistic conversation analysis

## Error Handling

The app now provides clear error messages:

- **Service unreachable**: DNS/network issues
- **Service timeout**: Service not responding
- **Service unavailable**: Configuration missing
- **Automatic fallback**: Seamless switch to demo mode

## Testing

1. **Without real service**: App should work in demo mode
2. **With real service**: Configure environment variables and test with actual phone numbers
3. **Error scenarios**: Test with invalid credentials to ensure graceful fallback

## Troubleshooting

### "Voice API service is unreachable"
- Check your internet connection
- Verify the API URL is correct
- Check if the service is operational

### "Demo Mode Active" 
- This is expected when no real voice service is configured
- Configure a real service to enable actual phone calls

### Service-specific issues
- Verify API credentials are correct
- Check service documentation for any changes
- Review service status page for outages

## Next Steps

1. Choose and configure a real voice service
2. Implement the chosen service's API integration
3. Test with development phone numbers
4. Deploy with production credentials

For implementation help, refer to:
- Twilio Voice API docs: https://www.twilio.com/docs/voice
- Vapi.ai documentation: https://docs.vapi.ai/
- The existing code structure in `lib/omnidimension.ts`
