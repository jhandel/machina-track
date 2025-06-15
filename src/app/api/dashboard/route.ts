import { NextRequest, NextResponse } from 'next/server';
import { getUnitOfWork } from '@/lib/database/repositories';
import { DatabaseError } from '@/lib/database/interfaces';

/**
 * GET /api/dashboard - Get dashboard summary data
 */
export async function GET(request: NextRequest) {
  try {
    const uow = getUnitOfWork();
    
    // Get dashboard summary
    const summary = await uow.dashboard.getDashboardSummary();
    
    // Get recent activity
    const { searchParams } = new URL(request.url);
    const activityLimit = parseInt(searchParams.get('activityLimit') || '10');
    const recentActivity = await uow.dashboard.getRecentActivity(activityLimit);
    
    // Get status counts
    const equipmentStatusCounts = await uow.dashboard.getEquipmentStatusCounts();
    const maintenanceStatusCounts = await uow.dashboard.getMaintenanceStatusCounts();

    return NextResponse.json({
      success: true,
      data: {
        summary,
        recentActivity,
        equipmentStatusCounts,
        maintenanceStatusCounts
      }
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
