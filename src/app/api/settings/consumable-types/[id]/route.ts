import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { z } from 'zod';
import { getUnitOfWork } from '@/lib/database/repositories';

const prisma = new PrismaClient();
const cuttingToolTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name } = cuttingToolTypeSchema.parse(body);
    const { id } = params;

    const uow = getUnitOfWork();
    const cuttingToolType = await uow.settings.updateConsumableType(id, name);

    return NextResponse.json({
      success: true,
      data: cuttingToolType
    });
  } catch (error) {
    console.error('Error updating Consumables type:', error);
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ 
        success: false,
        error: 'A Consumables type with this name already exists' 
      }, { status: 409 });
    }
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ 
        success: false,
        error: 'Consumables type not found' 
      }, { status: 404 });
    }
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update Consumables type' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const uow = getUnitOfWork();
    await uow.settings.deleteConsumableType(id);

    return NextResponse.json({ 
      success: true,
      message: 'Consumables type deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting Consumables type:', error);
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({ 
        success: false,
        error: 'Consumables type not found' 
      }, { status: 404 });
    }
    return NextResponse.json({ 
      success: false,
      error: 'Failed to delete Consumables type' 
    }, { status: 500 });
  }
}
