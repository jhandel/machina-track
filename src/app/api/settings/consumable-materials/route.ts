import { NextRequest, NextResponse } from 'next/server';
import { getUnitOfWork } from '@/lib/database/repositories';
import { z } from 'zod';

const materialSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
});

export async function GET() {
  try {
    const uow = getUnitOfWork();
    const materials = await uow.settings.getAllConsumableMaterials();
    return NextResponse.json({
      success: true,
      data: materials,
    });
  } catch (error) {
    console.error('Error fetching Consumables materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Consumables materials' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = materialSchema.parse(body);

    const uow = getUnitOfWork();
    const material = await uow.settings.createConsumableMaterial(name);

    return NextResponse.json({
      success: true,
      data: material
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating Consumables material:', error);
    return NextResponse.json(
      { error: 'Failed to create Consumables material' },
      { status: 500 }
    );
  }
}
