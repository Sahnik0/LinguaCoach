# Phone Number Handling in Language Coach App

This document outlines how phone numbers are validated, formatted, and sent to the Omnidimension API in the Language Coach App.

## Phone Number Format Requirements

For the Omnidimension API to successfully make phone calls:
- Phone numbers must include a country code (e.g., +15551234567)
- Format must be E.164 compliant: `+[country code][phone number]`
- No spaces, dashes, or parentheses are allowed

## Validation and Formatting Implementation

The app implements multiple validation and formatting checks at different levels:

### User Input Level (`phone-setup.tsx`)
- Initial validation is performed when users save their phone number
- Regex pattern: `/^\+\d{1,3}\d{10,}$/` ensures country code is present
- Formatting removes spaces, dashes, and parentheses: `.replace(/[\s\-()]/g, '')`
- User receives clear error message if format is incorrect

### API Route Level (`api/phone/initiate/route.ts`)
- Secondary validation before processing API request
- Same regex pattern ensures country code is present
- Logging captures the final formatted number before passing to Omnidimension API
- Returns 400 error if phone number format is invalid

### Omnidimension API Client Level (`lib/omnidimension.ts`)
- Final validation before making API call to Omnidimension
- Clean and validate phone number again to ensure proper format
- Enhanced logging records the exact phone number sent to the API
- Error handling for invalid phone number format

## Debugging Information

For debugging phone call issues, check the following log messages:
- "Formatted phone number before API call: [number]" in `call-interface.tsx`
- "API route: Initiating call to validated phone number: [number]" in the API route
- "Initiating call to validated phone number: [number] with agent [id]" in Omnidimension API client
- "Call successfully dispatched to [number]" for successful calls

## Common Issues

1. **Missing Country Code**: Phone number must start with + followed by country code
2. **Formatting Characters**: Ensure no spaces, dashes or parentheses in final number
3. **API Response Errors**: Check console logs for specific error messages from the API

## Demo Voice Mode Enhancements

When the Omnidimension API is unavailable or in demo mode, the system now provides:

1. **Real-time Voice Transcription**:
   - Uses browser's Speech Recognition API for live transcription
   - Supports multiple languages based on scenario selection
   - Provides visual feedback during voice input/output
   - Advanced speech recognition settings for improved accuracy

2. **AI-Powered Analysis**:
   - Transcript is analyzed using Groq AI or compatible local LLM
   - Provides personalized feedback based on actual conversation
   - Includes detailed scores for fluency, grammar, vocabulary, etc.
   - Generates custom improvement suggestions based on user performance

3. **Enhanced User Experience**:
   - Colored transcript for better readability
   - Auto-scrolling conversation view
   - Displays listening/speaking status indicators
   - Provides troubleshooting help for browser compatibility issues

For detailed instructions on using the demo voice mode, see the `DEMO_VOICE_USAGE.md` document.
