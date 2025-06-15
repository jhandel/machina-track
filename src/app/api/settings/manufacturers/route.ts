import { NextRequest, NextResponse } from 'next/server';
import { getUnitOfWork } from '@/lib/database/repositories';
import { z } from 'zod';

const manufacturerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
});

export async function GET() {
  try {
    const uow = getUnitOfWork();
    const manufacturers = await uow.settings.getAllManufacturers();
        return NextResponse.json({
      success: true,
      data: manufacturers,
    });
  } catch (error) {
    console.error('Error fetching manufacturers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch manufacturers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = manufacturerSchema.parse(body);

    const uow = getUnitOfWork();
    const manufacturer = await uow.settings.createManufacturer(name);

    return NextResponse.json(manufacturer, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating manufacturer:', error);
    return NextResponse.json(
      { error: 'Failed to create manufacturer' },
      { status: 500 }
    );
  }
}
