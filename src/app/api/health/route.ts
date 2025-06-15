import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/database/connection';

/**
 * GET /api/health - Health check endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const isHealthy = checkDatabaseHealth();
    
    if (!isHealthy) {
      return NextResponse.json(
        { 
          success: false, 
          status: 'unhealthy',
          error: 'Database connection failed' 
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'SQLite',
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        status: 'unhealthy',
        error: 'Health check failed' 
      },
      { status: 503 }
    );
  }
}
