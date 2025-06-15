import { NextRequest, NextResponse } from 'next/server';
import { getUnitOfWork } from '@/lib/database/repositories';
import { z } from 'zod';

const materialSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name } = materialSchema.parse(body);
    const { id } = params;

    const uow = getUnitOfWork();
    const material = await uow.settings.updateCuttingToolMaterial(id, name);

    return NextResponse.json({
      success: true,
      data: material
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating cutting tool material:', error);
    return NextResponse.json(
      { error: 'Failed to update cutting tool material' },
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
    await uow.settings.deleteCuttingToolMaterial(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting cutting tool material:', error);
    return NextResponse.json(
      { error: 'Failed to delete cutting tool material' },
      { status: 500 }
    );
  }
}
