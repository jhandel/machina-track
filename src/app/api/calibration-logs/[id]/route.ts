import { NextRequest, NextResponse } from 'next/server';
import { getUnitOfWork } from '@/lib/database/repositories';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const uow = getUnitOfWork();

    const calibrationLog = await uow.calibrationLogs.findById(id);

    if (!calibrationLog) {
      return NextResponse.json(
        { success: false, error: 'Calibration log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: calibrationLog
    });
  } catch (error) {
    console.error('Error fetching calibration log:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch calibration log',
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
    const updatedLog = await uow.calibrationLogs.update(id, body);

    if (!updatedLog) {
      return NextResponse.json(
        { success: false, error: 'Calibration log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedLog
    });
  } catch (error) {
    console.error('Error updating calibration log:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update calibration log',
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

    const deleted = await uow.calibrationLogs.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Calibration log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Calibration log deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting calibration log:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete calibration log',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // For PATCH, we only update specific fields (like certificate_url)
    const allowedUpdates = ['certificate_url'];
    const updates: Record<string, any> = {};

    for (const [key, value] of Object.entries(body)) {
      if (allowedUpdates.includes(key)) {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid fields to update',
          allowedFields: allowedUpdates
        },
        { status: 400 }
      );
    }

    const uow = getUnitOfWork();
    const updatedLog = await uow.calibrationLogs.update(id, updates);

    if (!updatedLog) {
      return NextResponse.json(
        { success: false, error: 'Calibration log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Calibration log updated successfully',
      data: updatedLog
    });
  } catch (error) {
    console.error('Error patching calibration log:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update calibration log',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
