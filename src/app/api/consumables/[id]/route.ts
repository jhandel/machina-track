import { NextRequest, NextResponse } from 'next/server';
import { getUnitOfWork } from '@/lib/database/repositories';
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/database/interfaces';
import { z } from 'zod';

// Partial schema for updates
const ConsumableUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  material: z.string().optional(),
  size: z.string().optional(),
  quantity: z.number().int().min(0).optional(),
  minQuantity: z.number().int().min(0).optional(),
  location: z.string().min(1).optional(),
  toolLifeHours: z.number().optional(),
  remainingToolLifeHours: z.number().optional(),
  lastUsedDate: z.string().optional(),
  endOfLifeDate: z.string().optional(),
  supplier: z.string().optional(),
  costPerUnit: z.number().optional(),
  imageUrl: z.string().optional(),
  notes: z.string().optional()
});

/**
 * GET /api/consumables/[id] - Get a specific consumable
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const uow = getUnitOfWork();
    const tool = await uow.consumables.findById(id);

    if (!tool) {
      return NextResponse.json(
        { success: false, error: 'Consumable not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tool
    });
  } catch (error) {
    console.error(`GET /api/consumables/[id] error:`, error);
    
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }
    
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
 * PUT /api/consumables/[id] - Update a consumable
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = ConsumableUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const uow = getUnitOfWork();
    const updatedTool = await uow.consumables.update(params.id, validationResult.data);

    if (!updatedTool) {
      return NextResponse.json(
        { success: false, error: 'Consumables not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedTool
    });
  } catch (error) {
    console.error(`PUT /api/consumables/${params.id} error:`, error);
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }
    
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
 * DELETE /api/consumables/[id] - Delete a consumable
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const uow = getUnitOfWork();
    const deleted = await uow.consumables.delete(params.id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Consumables not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Consumables deleted successfully'
    });
  } catch (error) {
    console.error(`DELETE /api/consumables/${params.id} error:`, error);
    
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }
    
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
 * PATCH /api/consumables/[id] - Update consumable quantity
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    if (typeof body.quantity !== 'number' || body.quantity < 0) {
      return NextResponse.json(
        { success: false, error: 'Valid quantity is required' },
        { status: 400 }
      );
    }

    const uow = getUnitOfWork();
    const updatedTool = await uow.consumables.updateQuantity(params.id, body.quantity);

    if (!updatedTool) {
      return NextResponse.json(
        { success: false, error: 'Consumables not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedTool
    });
  } catch (error) {
    console.error(`PATCH /api/consumables/${params.id} error:`, error);
    
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
