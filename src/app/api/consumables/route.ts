import { NextRequest, NextResponse } from 'next/server';
import { getUnitOfWork } from '@/lib/database/repositories';
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/database/interfaces';
import { z } from 'zod';

// Validation schema for cutting tools
const ConsumableSchema = z.object({
  name: z.string().min(1),
  typeId: z.string().min(1),
  materialId: z.string().optional(),
  size: z.string().optional(),
  quantity: z.number().int().min(0),
  minQuantity: z.number().int().min(0),
  locationId: z.string().min(1),
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
 * GET /api/cutting-tools - Get all cutting tools with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const location = searchParams.get('location');
    const type = searchParams.get('type');
    const lowInventory = searchParams.get('low_inventory') === 'true';
    const endOfLife = searchParams.get('endOfLife');
    const search = searchParams.get('search');

    const uow = getUnitOfWork();
    let tools;

    if (lowInventory) {
      tools = await uow.consumables.findLowInventory();
    } else if (location) {
      tools = await uow.consumables.findByLocation(location);
    } else if (type) {
      tools = await uow.consumables.findByType(type);
    } else if (endOfLife) {
      tools = await uow.consumables.findEndOfLife(endOfLife);
    } else if (search) {
      tools = await uow.consumables.search(search);
    } else {
      tools = await uow.consumables.findAll(limit, offset);
    }

    const total = await uow.consumables.count();

    return NextResponse.json({
      success: true,
      data: tools,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('GET /api/cutting-tools error:', error);
    
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
 * POST /api/cutting-tools - Create a new cutting tool
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = ConsumableSchema.safeParse(body);
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
    const tool = await uow.consumables.create(validationResult.data);

    return NextResponse.json({
      success: true,
      data: tool
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/cutting-tools error:', error);
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
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
