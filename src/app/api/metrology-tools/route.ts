import { NextRequest, NextResponse } from 'next/server';
import { getUnitOfWork } from '@/lib/database/repositories';
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/database/interfaces';
import { z } from 'zod';

// Validation schema for metrology tools
const MetrologyToolSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  serialNumber: z.string().min(1),
  manufacturer: z.string().optional(),
  calibrationIntervalDays: z.number().int().min(1),
  lastCalibrationDate: z.string().optional(),
  nextCalibrationDate: z.string().optional(),
  calibrationLogIds: z.array(z.string()).default([]),
  location: z.string().optional(),
  status: z.enum(['calibrated', 'due_calibration', 'out_of_service', 'awaiting_calibration']).default('calibrated'),
  imageUrl: z.string().optional(),
  notes: z.string().optional()
});

/**
 * GET /api/metrology-tools - Get all metrology tools with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const location = searchParams.get('location');
    const dueSoon = searchParams.get('dueSoon') === 'true';
    const search = searchParams.get('search');

    const uow = getUnitOfWork();
    let tools;

    if (dueSoon) {
      tools = await uow.metrologyTools.findDueForCalibration();
    } else if (status) {
      tools = await uow.metrologyTools.findByStatus(status as any);
    } else if (search) {
      tools = await uow.metrologyTools.search(search);
    } else {
      tools = await uow.metrologyTools.findAll(limit, offset);
    }

    const total = await uow.metrologyTools.count();

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
    console.error('GET /api/metrology-tools error:', error);
    
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
 * POST /api/metrology-tools - Create a new metrology tool
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = MetrologyToolSchema.safeParse(body);
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
    const tool = await uow.metrologyTools.create(validationResult.data);

    return NextResponse.json({
      success: true,
      data: tool
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/metrology-tools error:', error);
    
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
