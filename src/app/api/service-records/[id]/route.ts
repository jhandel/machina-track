import { NextRequest, NextResponse } from 'next/server';
import { getUnitOfWork } from '@/lib/database/repositories';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const uow = getUnitOfWork();
    
    const serviceRecord = await uow.serviceRecords.findById(id);
    
    if (!serviceRecord) {
      return NextResponse.json(
        { success: false, error: 'Service record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serviceRecord
    });
  } catch (error) {
    console.error('Error fetching service record:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch service record',
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
    const updatedServiceRecord = await uow.serviceRecords.update(id, body);
    
    if (!updatedServiceRecord) {
      return NextResponse.json(
        { success: false, error: 'Service record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedServiceRecord
    });
  } catch (error) {
    console.error('Error updating service record:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update service record',
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
    
    const deleted = await uow.serviceRecords.delete(id);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Service record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Service record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service record:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete service record',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
