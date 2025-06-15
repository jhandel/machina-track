import { NextRequest, NextResponse } from 'next/server';
import { getUnitOfWork } from '@/lib/database/repositories';
import { ServiceRecord } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const taskId = searchParams.get('taskId');
    const performer = searchParams.get('performer');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const equipmentId = searchParams.get('equipmentId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const uow = getUnitOfWork();
    let serviceRecords: ServiceRecord[];

    if (taskId) {
      serviceRecords = await uow.serviceRecords.findByTaskId(taskId);
    } else if (performer) {
      serviceRecords = await uow.serviceRecords.findByPerformer(performer);
    } else if (startDate && endDate) {
      serviceRecords = await uow.serviceRecords.findByDateRange(startDate, endDate);
    } else if (equipmentId) {
      serviceRecords = await uow.serviceRecords.findByEquipmentId(equipmentId);
    } else {
      serviceRecords = await uow.serviceRecords.findAll(limit, offset);
    }

    return NextResponse.json({
      success: true,
      data: serviceRecords,
      count: serviceRecords.length
    });
  } catch (error) {
    console.error('Error fetching service records:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch service records',
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
    if (!body.maintenanceTaskId || !body.date || !body.performedBy || !body.descriptionOfWork) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: maintenanceTaskId, date, performedBy, descriptionOfWork' 
        },
        { status: 400 }
      );
    }

    const uow = getUnitOfWork();
    const serviceRecord = await uow.serviceRecords.create(body);

    return NextResponse.json({
      success: true,
      data: serviceRecord
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating service record:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create service record',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
