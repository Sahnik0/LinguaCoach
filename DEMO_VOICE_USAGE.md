# Demo Voice Interactive Mode

The Demo Voice Interactive Mode provides a browser-based alternative to real phone calls for language practice when the Omnidimension API is unavailable or for testing purposes.

## Features

- Automatic speech recognition in multiple languages
- Text-to-speech responses from the AI assistant
- Real-time transcript display with color coding
- Advanced transcript processing to avoid duplicates
- Conversation history tracking for AI analysis
- Personalized AI feedback on your conversation
- Integration with call analysis for performance evaluation

## Requirements

- Modern browser with Web Speech API support:
  - Chrome/Edge (recommended, best support)
  - Safari (good support)
  - Firefox (limited support)
- Microphone access permission
- Browser audio permission

## Using Demo Voice Mode

### Microphone Access

When the Demo Voice mode activates, your browser will prompt you to allow microphone access. You must grant this permission for voice input to work.

If you accidentally deny permission:
1. Click the lock/info icon in your browser's address bar
2. Find and update the microphone permission setting
3. Refresh the page to restart the demo

### Conversation Flow

1. **Starting**: The AI assistant will greet you automatically to begin the conversation
2. **Taking turns**: 
   - When the green "Listening" indicator is active, speak normally
   - When the blue "Speaking" indicator is active, listen to the AI's response
3. **Visual feedback**:
   - Your speech will appear in green boxes
   - The AI's responses will appear in blue boxes
   - System messages appear in yellow boxes
   - The full transcript is saved below for reference

### Optimizing Speech Recognition

The demo mode uses an enhanced speech recognition system that:
1. **Continuously listens** to avoid missing parts of your speech
2. **Filters for confidence** to ensure accuracy (low-confidence guesses are ignored)
3. **Prevents duplicates** to keep the transcript clean and accurate
4. **Handles interim results** to show feedback as you speak

For best results:
- **Speak clearly** but naturally at a moderate pace
- **Pause briefly** between sentences
- **Monitor the transcript** to ensure your words are being captured correctly
- **Adjust your environment** to minimize background noise
- **Position your microphone** properly (close to your mouth but not too close)

## AI-Powered Analysis

After your conversation, the system now provides AI-powered analysis of your actual conversation rather than generic feedback:

### Analysis Process

1. Your complete conversation transcript is captured during the session
2. When you end the call, your transcript is analyzed by an AI service
3. The analysis examines multiple aspects of your language performance
4. Results are displayed with actionable feedback

### Analysis Components

Your analysis includes:

1. **Performance Metrics**: 
   - Fluency, grammar, vocabulary, pronunciation scores
   - Confidence rating
   - Overall performance score

2. **Personalized Feedback**:
   - Strengths identified in your actual speech
   - Weaknesses spotted in your conversation
   - Detailed feedback on your performance
   
3. **Improvement Guidance**:
   - Specific areas to focus on
   - Next steps for your language learning
   - Practical suggestions for improvement

### Analysis Service Options

The system attempts to use:
1. **Groq API** (primary service)
2. **Local LLM** (if configured via NEXT_PUBLIC_LOCAL_AI_ENDPOINT)
3. **Fallback analysis** (if both options unavailable)

### Browser-Specific Notes

**Chrome/Edge**:
- Provides the best experience with consistent voice recognition
- Supports more languages with better quality
- May require HTTPS for speech recognition to work

**Safari**:
- Generally works well but may have shorter listening sessions
- May prompt separately for microphone access
- Voice quality may vary by language

**Firefox**:
- Limited speech recognition support
- May fall back to text-only mode
- Consider using Chrome for best experience

## Troubleshooting

### No Sound

- Check your browser's audio output settings
- Ensure your device is not muted
- Try a different browser

### Microphone Not Working

- Check if browser has microphone permission
- Test your microphone in another application
- Try disconnecting and reconnecting any external microphones
- Use browser settings to select the correct microphone if you have multiple

### Recognition Problems

- Speak clearly and at a normal pace
- Reduce background noise
- Position yourself closer to the microphone
- Try a different browser (Chrome recommended)
- For non-English languages, ensure you have the appropriate language packs installed

### Getting Better AI Analysis

For the most helpful AI analysis of your conversation:

1. **Have a substantial conversation**: Longer, more varied conversations provide better analysis data
2. **Stay on topic**: Keep your conversation relevant to the selected scenario
3. **Use varied vocabulary**: Demonstrate your range of vocabulary and expressions
4. **Try complex structures**: Use different grammar structures to showcase your abilities
5. **Build complete responses**: Use complete sentences rather than short phrases
6. **Check the transcript**: Ensure your speech is being transcribed correctly
7. **Practice natural flow**: Aim for natural conversation rather than rehearsed responses

### System Messages

If you see a system message like "Speech recognition not supported" or "Using text-only mode," it means your browser doesn't fully support the Web Speech API. Try using Chrome or Edge for the best experience.

## Languages Supported

The demo voice mode supports the following languages:

- English (US)
- Spanish (Spain)
- French (France)
- German (Germany)
- Italian (Italy)
- Portuguese (Brazil)
- Japanese (Japan)
- Chinese (China)
- Korean (Korea)
- Russian (Russia)
- Dutch (Netherlands)
- Hindi (India)
- Arabic (Saudi Arabia)

Some languages may have limited voice quality depending on your browser and operating system.
