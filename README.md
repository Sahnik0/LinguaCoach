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

#### Omnidimension API (for phone call functionality)
- `OMNIDIMENSION_API_KEY`: Omnidimension API key for phone call features
- `OMNIDIMENSION_BASE_URL`: Omnidimension API base URL (default: https://api.omnidimension.ai/v1)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

2. Set up environment variables (see above)

3. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Important Notes

- Never commit `.env.local` or any file containing actual API keys to version control
- The `.env.example` file shows the required environment variables without actual values
- Make sure to obtain valid API keys from Groq, Firebase, and Omnidimension services before running the application

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
