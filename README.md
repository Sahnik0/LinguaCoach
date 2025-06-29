# Language Coach App

A Next.js application for language learning with AI-powered conversation analysis and phone call practice.

## Environment Variables

This project requires several environment variables to function properly. Follow these steps to set them up:

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your actual API keys and configuration values in `.env.local`:

### Required Environment Variables

#### Groq API (for AI conversation analysis)
- `GROQ_API_KEY`: Your Groq API key for AI conversation analysis
- `GROQ_BASE_URL`: Groq API base URL (default: https://api.groq.com/openai/v1)

#### Firebase (for authentication and database)
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase app ID
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`: Firebase measurement ID

#### Voice API Configuration (for phone call functionality)

**OmniDimension Voice API** (Recommended for real phone calls):

Get your API key from [OmniDimension Dashboard](https://www.omnidim.io/)
- `OMNIDIM_API_KEY`: Your OmniDimension API key
- `OMNIDIM_BASE_URL`: OmniDimension API base URL (default: https://api.omnidim.io/v1)

**Alternative Voice Services**:

1. **Twilio Voice**:
   - `TWILIO_ACCOUNT_SID`: Your Twilio Account SID
   - `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token

2. **Vapi.ai**:
   - `VAPI_API_KEY`: Your Vapi.ai API key

3. **Custom Voice Service**:
   - `CUSTOM_VOICE_API_KEY`: Your custom voice API key
   - `CUSTOM_VOICE_BASE_URL`: Your custom voice API base URL

**Legacy Support** (for backward compatibility):
- `OMNIDIMENSION_API_KEY`: Legacy environment variable name
- `OMNIDIMENSION_BASE_URL`: Legacy base URL variable

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

2. Set up environment variables (see above)

3. **Set up Firebase Firestore indexes** (Important!):
   ```bash
   # View setup instructions
   node scripts/setup-firestore-indexes.js
   
   # Deploy indexes to Firebase
   firebase deploy --only firestore:indexes
   ```
   
   📋 **Note**: Firestore indexes are required for the app to work properly. The app includes fallback queries, but performance will be significantly better with proper indexes. See [docs/FIRESTORE_SETUP.md](docs/FIRESTORE_SETUP.md) for detailed instructions.

4. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Important Notes

- Never commit `.env.local` or any file containing actual API keys to version control
- The `.env.example` file shows the required environment variables without actual values
- Make sure to obtain valid API keys from Groq and Firebase services before running the application
- **Voice Services**: To enable real phone calls, get an API key from [OmniDimension](https://www.omnidim.io/). Without this, the app will automatically switch to demo mode
- **Demo Mode**: When voice services are unavailable or not configured, the app automatically switches to demo mode to demonstrate functionality
- **Firebase Indexes**: Firestore composite indexes are required for optimal performance. Deploy them using `firebase deploy --only firestore:indexes`

## Firebase Setup

### Firestore Indexes
The app requires several composite indexes for complex queries. These are defined in `firestore.indexes.json`.

**Quick Setup:**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# View setup instructions
npm run setup:indexes

# Login and deploy indexes
firebase login
npm run deploy:indexes

# Check index status
npm run firebase:indexes
```

**Detailed Instructions:** See [docs/FIRESTORE_SETUP.md](docs/FIRESTORE_SETUP.md)

**Index Status:** The app includes fallback queries and will show warnings if indexes are missing.

## Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Firebase Setup
- `npm run setup:indexes` - Show Firestore indexes setup instructions
- `npm run deploy:indexes` - Deploy Firestore indexes to Firebase
- `npm run firebase:indexes` - Check Firestore indexes status
