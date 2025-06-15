import { NextRequest, NextResponse } from 'next/server';
import { getUnitOfWork } from '@/lib/database/repositories';
import { z } from 'zod';

const toolTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name } = toolTypeSchema.parse(body);
    const { id } = params;

    const uow = getUnitOfWork();
    const toolType = await uow.settings.updateMetrologyToolType(id, name);

    return NextResponse.json({
      success: true,
      data: toolType
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating metrology tool type:', error);
    return NextResponse.json(
      { error: 'Failed to update metrology tool type' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const uow = getUnitOfWork();
    await uow.settings.deleteMetrologyToolType(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting metrology tool type:', error);
    return NextResponse.json(
      { error: 'Failed to delete metrology tool type' },
      { status: 500 }
    );
  }
}
