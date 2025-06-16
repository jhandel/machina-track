import { NextRequest, NextResponse } from 'next/server';
import { getUnitOfWork } from '@/lib/database/repositories';
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/database/interfaces';
import { z } from 'zod';

// Validation schema for equipment
const EquipmentSchema = z.object({
  name: z.string().min(1),
  model: z.string().min(1),
  serialNumber: z.string().min(1),
  locationId: z.string().min(1),
  purchaseDate: z.string().optional(),
  status: z.enum(['operational', 'maintenance', 'decommissioned']).default('operational'),
  imageUrl: z.string().optional(),
  notes: z.string().optional(),
});

const UpdateEquipmentSchema = EquipmentSchema.partial();

/**
 * GET /api/equipment - Get all equipment with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const location = searchParams.get('location');
    const search = searchParams.get('search');

    const uow = getUnitOfWork();

    let equipment;
    if (search) {
      equipment = await uow.equipment.search(search);
    } else if (status) {
      equipment = await uow.equipment.findByStatus(status as any);
    } else if (location) {
      equipment = await uow.equipment.findByLocation(location);
    } else {
      equipment = await uow.equipment.findAll(limit, offset);
    }

    const total = await uow.equipment.count();

    return NextResponse.json({
      success: true,
      data: equipment,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + equipment.length < total
      }
    });
  } catch (error) {
    console.error('GET /api/equipment error:', error);
    
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/equipment - Create new equipment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = EquipmentSchema.parse(body);

    const uow = getUnitOfWork();
    const equipment = await uow.equipment.create(validatedData);

    return NextResponse.json({
      success: true,
      data: equipment
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/equipment error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      );
    }

    if (error instanceof DatabaseError) {
      const status = error.name === 'DuplicateError' ? 409 : 500;
      return NextResponse.json(
        { success: false, error: error.message },
        { status }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
