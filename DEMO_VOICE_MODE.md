# Using the Interactive Demo Voice Mode

The Language Coach App now includes an interactive voice-based demo mode that allows you to practice language conversations directly in your browser when the actual phone call service is unavailable.

## How It Works

When the real phone service is unavailable (due to missing API keys or service outages), the app automatically falls back to demo mode. The new interactive demo mode provides:

- **Voice input** through your browser's microphone
- **Voice output** through your browser's speakers
- **Real-time transcription** of your conversation

## Getting Started

1. Start a practice call as normal
2. If the system falls back to demo mode, you'll see the interactive voice interface
3. Grant microphone permissions when prompted by your browser
4. Listen to the AI coach's introduction
5. When you see "Listening..." speak naturally in response
6. The conversation will continue back and forth

## Requirements

- A modern web browser (Chrome, Firefox, Edge, or Safari)
- A working microphone
- Browser permission to access your microphone
- Speakers or headphones

## Troubleshooting

If you encounter issues with the demo voice mode:

- **No voice output**: Check that your volume is turned up and not muted
- **No microphone input**: Ensure you've granted microphone permissions to the site
- **Voice recognition issues**: Speak clearly and check that the correct language is selected for your scenario
- **Browser compatibility**: Try using Google Chrome if other browsers aren't working properly

## Languages Supported

The demo mode supports multiple languages including:
- English
- Spanish
- French
- German
- Italian
- Portuguese
- Japanese
- Chinese
- Korean
- Russian
- Dutch
- Hindi
- Arabic

Language selection is based on the scenario you choose.

## Privacy Note

The voice recognition in demo mode uses your browser's built-in speech recognition capabilities. No audio data is sent to our servers - all processing happens locally in your browser.

## Switching to Real Calls

To switch from demo mode to real phone calls, you'll need to:

1. Obtain an Omnidimension API key
2. Configure the API key in your .env.local file
3. Restart the application

Once properly configured, the app will use real phone calls instead of the browser-based demo mode.
