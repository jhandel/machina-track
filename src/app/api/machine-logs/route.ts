import { NextRequest, NextResponse } from 'next/server';
import { getUnitOfWork } from '@/lib/database/repositories';
import { MachineLogEntry } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const equipmentId = searchParams.get('equipmentId');
    const errorCode = searchParams.get('errorCode');
    const metricName = searchParams.get('metricName');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const hours = parseInt(searchParams.get('hours') || '24');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const uow = getUnitOfWork();
    let machineLogs: MachineLogEntry[];

    if (equipmentId && startDate && endDate) {
      machineLogs = await uow.machineLogs.findByDateRange(equipmentId, startDate, endDate);
    } else if (equipmentId && searchParams.get('recent')) {
      machineLogs = await uow.machineLogs.findRecentLogs(equipmentId, hours);
    } else if (equipmentId) {
      machineLogs = await uow.machineLogs.findByEquipmentId(equipmentId, limit);
    } else if (errorCode) {
      machineLogs = await uow.machineLogs.findByErrorCode(errorCode);
    } else if (metricName) {
      machineLogs = await uow.machineLogs.findByMetric(metricName);
    } else {
      machineLogs = await uow.machineLogs.findAll(limit, offset);
    }

    return NextResponse.json({
      success: true,
      data: machineLogs,
      count: machineLogs.length
    });
  } catch (error) {
    console.error('Error fetching machine logs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch machine logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.equipmentId || !body.timestamp || !body.metricName || body.metricValue === undefined) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: equipmentId, timestamp, metricName, metricValue' 
        },
        { status: 400 }
      );
    }

    const uow = getUnitOfWork();
    const machineLog = await uow.machineLogs.create(body);

    return NextResponse.json({
      success: true,
      data: machineLog
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating machine log:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create machine log',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
