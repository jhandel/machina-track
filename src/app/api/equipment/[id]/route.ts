import { NextRequest, NextResponse } from 'next/server';
import { getUnitOfWork } from '@/lib/database/repositories';
import { DatabaseError, NotFoundError } from '@/lib/database/interfaces';
import { z } from 'zod';

// Validation schema for equipment updates
const UpdateEquipmentSchema = z.object({
  name: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  serialNumber: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  purchaseDate: z.string().optional(),
  status: z.enum(['operational', 'maintenance', 'decommissioned']).optional(),
  imageUrl: z.string().optional(),
  notes: z.string().optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/equipment/[id] - Get equipment by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const uow = getUnitOfWork();
    const equipment = await uow.equipment.findById(id);

    if (!equipment) {
      return NextResponse.json(
        { success: false, error: 'Equipment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: equipment
    });
  } catch (error) {
    console.error(`GET /api/equipment/[id] error:`, error);

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
 * PUT /api/equipment/[id] - Update equipment by ID
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = UpdateEquipmentSchema.parse(body);

    const uow = getUnitOfWork();
    const equipment = await uow.equipment.update(id, validatedData);

    if (!equipment) {
      return NextResponse.json(
        { success: false, error: 'Equipment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: equipment
    });
  } catch (error) {
    console.error(`PUT /api/equipment/[id] error:`, error);

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

/**
 * DELETE /api/equipment/[id] - Delete equipment by ID
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const uow = getUnitOfWork();
    const deleted = await uow.equipment.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Equipment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Equipment deleted successfully'
    });
  } catch (error) {
    console.error(`DELETE /api/equipment/[id] error:`, error);

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
