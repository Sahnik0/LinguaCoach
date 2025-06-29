# OmniDimension Voice API Integration Guide

This guide helps you set up real phone calls using the OmniDimension Voice API service.

## Quick Setup

1. **Get an API Key**
   - Visit [OmniDimension Dashboard](https://www.omnidim.io/)
   - Sign up for an account
   - Navigate to your account settings to get your API key

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Add your OmniDimension API key:
   ```bash
   OMNIDIM_API_KEY=your_api_key_here
   ```

3. **Test the Integration**
   - Start your development server: `npm run dev`
   - Try initiating a phone call from the app
   - The app should now use real voice AI instead of demo mode

## How It Works

### 1. Agent Creation
The app automatically creates or finds a suitable AI agent for language coaching when you make your first call.

### 2. Call Dispatch
When you initiate a call, the app:
- Gets or creates an appropriate AI agent
- Dispatches a call to your phone number using OmniDimension's API
- Tracks the call status in real-time

### 3. Call Analysis
After the call ends, the app retrieves:
- Call transcript
- Performance analysis
- AI-generated feedback and suggestions

## API Endpoints Used

- `GET /agents` - List existing agents
- `POST /agents` - Create new language coach agent
- `POST /calls/dispatch` - Initiate phone call
- `GET /calls/{id}` - Get call status and analysis

## Phone Number Format

Make sure to include the country code with a leading plus sign:
- ✅ Correct: `+15551234567`
- ❌ Incorrect: `5551234567` or `15551234567`

## Troubleshooting

### "API key not configured"
- Check that `OMNIDIM_API_KEY` is set in your `.env.local` file
- Restart your development server after adding environment variables

### "Service unreachable"
- Check your internet connection
- Verify the API key is valid in the OmniDimension dashboard
- Check if there are any service outages at [OmniDimension Status](https://www.omnidim.io/)

### Call not connecting
- Ensure your phone number includes the country code
- Check that your phone can receive calls
- Verify your OmniDimension account has sufficient credits for calls

## Demo Mode vs Real Mode

| Feature | Demo Mode | Real Mode (OmniDimension) |
|---------|-----------|---------------------------|
| Phone Calls | Simulated | Real AI voice calls |
| Call Analysis | Mock data | Real transcript analysis |
| Voice Quality | N/A | Professional AI voice |
| Cost | Free | Per-minute pricing |

## Next Steps

- Explore [OmniDimension Documentation](https://www.omnidim.io/docs) for advanced features
- Configure custom agents for specific language learning scenarios
- Set up webhooks for advanced call handling
- Integrate with your existing learning management systems

## Support

- OmniDimension: [Support](https://www.omnidim.io/support)
- This App: Create an issue in the repository
