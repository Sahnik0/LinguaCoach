import { NextResponse } from 'next/server';

/**
 * Health check endpoint that can be used to verify the server is running
 * and to check basic configuration
 */
export async function GET() {
  try {
    // Basic system info
    const systemInfo = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      region: process.env.VERCEL_REGION || process.env.RENDER_REGION || 'unknown',
    };

    // API Configuration check (don't expose actual keys)
    const apiConfig = {
      omnidim: {
        baseUrlConfigured: !!process.env.OMNIDIM_BASE_URL || !!process.env.NEXT_PUBLIC_OMNIDIM_BASE_URL,
        apiKeyConfigured: !!(process.env.OMNIDIM_API_KEY || process.env.NEXT_PUBLIC_OMNIDIM_API_KEY),
      },
      firebase: {
        configuredInClient: !!(
          process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
          process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        )
      },
      groq: {
        apiKeyConfigured: !!process.env.GROQ_API_KEY,
        baseUrlConfigured: !!process.env.GROQ_BASE_URL
      }
    };

    // Memory usage (if available)
    const memoryUsage = process.memoryUsage ? {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
    } : 'Not available';

    return NextResponse.json({
      status: 'healthy',
      uptime: Math.round(process.uptime()) + ' seconds',
      system: systemInfo,
      config: apiConfig,
      memory: memoryUsage
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
