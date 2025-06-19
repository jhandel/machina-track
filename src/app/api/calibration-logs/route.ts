import { NextRequest, NextResponse } from 'next/server';
import { getUnitOfWork } from '@/lib/database/repositories';
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/database/interfaces';
import { z } from 'zod';
import { CalibrationLog } from '@/lib/types';

// Validation schema for calibration logs
const CalibrationLogSchema = z.object({
  metrologyToolId: z.string().min(1),
  date: z.string().min(1), // ISO date string
  performedBy: z.string().min(1),
  notes: z.string().optional(),
  result: z.enum(['pass', 'fail', 'adjusted']),
  certificateUrl: z.string().optional(),
  nextDueDate: z.string().optional()
});

/**
 * GET /api/calibration-logs - Get all calibration logs with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const toolId = searchParams.get('toolId');
    const performedBy = searchParams.get('performedBy');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const result = searchParams.get('result');

    const uow = getUnitOfWork();
    let logs: CalibrationLog[] = [];

    if (toolId) {
      logs = await uow.calibrationLogs.findByToolId(toolId);
    } else if (performedBy) {
      logs = await uow.calibrationLogs.findByPerformer(performedBy);
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        logs = [];
      } else {
        logs = await uow.calibrationLogs.findByDateRange(start, end);
      }
    } else if (result) {
      logs = await uow.calibrationLogs.findByResult(result);
    } else {
      logs = (await uow.calibrationLogs.findAll(limit, offset));
    }

    const total = await uow.calibrationLogs.count();

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('GET /api/calibration-logs error:', error);

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
 * POST /api/calibration-logs - Create a new calibration log
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = CalibrationLogSchema.safeParse(body);
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
    const log = await uow.calibrationLogs.create(validationResult.data);

    return NextResponse.json({
      success: true,
      data: log
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/calibration-logs error:', error);

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
