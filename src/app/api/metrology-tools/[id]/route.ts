import { NextRequest, NextResponse } from 'next/server';
import { getUnitOfWork } from '@/lib/database/repositories';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const uow = getUnitOfWork();
    
    const metrologyTool = await uow.metrologyTools.findById(id);
    
    if (!metrologyTool) {
      return NextResponse.json(
        { success: false, error: 'Metrology tool not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: metrologyTool
    });
  } catch (error) {
    console.error('Error fetching metrology tool:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch metrology tool',
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
    const updatedTool = await uow.metrologyTools.update(id, body);
    
    if (!updatedTool) {
      return NextResponse.json(
        { success: false, error: 'Metrology tool not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedTool
    });
  } catch (error) {
    console.error('Error updating metrology tool:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update metrology tool',
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
    
    const deleted = await uow.metrologyTools.delete(id);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Metrology tool not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Metrology tool deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting metrology tool:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete metrology tool',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
