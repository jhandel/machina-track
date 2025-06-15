import { NextRequest, NextResponse } from 'next/server';
import { getUnitOfWork } from '@/lib/database/repositories';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const uow = getUnitOfWork();
    
    const machineLog = await uow.machineLogs.findById(id);
    
    if (!machineLog) {
      return NextResponse.json(
        { success: false, error: 'Machine log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: machineLog
    });
  } catch (error) {
    console.error('Error fetching machine log:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch machine log',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const uow = getUnitOfWork();
    const updatedMachineLog = await uow.machineLogs.update(id, body);
    
    if (!updatedMachineLog) {
      return NextResponse.json(
        { success: false, error: 'Machine log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedMachineLog
    });
  } catch (error) {
    console.error('Error updating machine log:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update machine log',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const uow = getUnitOfWork();
    
    const deleted = await uow.machineLogs.delete(id);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Machine log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Machine log deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting machine log:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete machine log',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
