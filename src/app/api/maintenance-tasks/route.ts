import { NextRequest, NextResponse } from 'next/server';
import { getUnitOfWork } from '@/lib/database/repositories';
import { DatabaseError } from '@/lib/database/interfaces';
import { z } from 'zod';

// Validation schema for maintenance tasks
const MaintenanceTaskSchema = z.object({
  equipmentId: z.string().min(1),
  description: z.string().min(1),
  frequencyDays: z.number().int().min(1).optional(),
  lastPerformedDate: z.string().optional(),
  nextDueDate: z.string().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue', 'skipped']).default('pending'),
  partsUsed: z.array(z.object({
    partName: z.string(),
    quantity: z.number().int().min(1)
  })).optional(),
});

const UpdateMaintenanceTaskSchema = MaintenanceTaskSchema.partial();

/**
 * GET /api/maintenance-tasks - Get all maintenance tasks with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const equipmentId = searchParams.get('equipmentId');
    const assignedTo = searchParams.get('assignedTo');
    const upcoming = searchParams.get('upcoming'); // number of days
    const overdue = searchParams.get('overdue') === 'true';

    const uow = getUnitOfWork();

    let tasks;
    if (overdue) {
      tasks = await uow.maintenanceTasks.findOverdue();
    } else if (upcoming) {
      tasks = await uow.maintenanceTasks.findUpcoming(parseInt(upcoming));
    } else if (equipmentId) {
      tasks = await uow.maintenanceTasks.findByEquipmentId(equipmentId);
    } else if (status) {
      tasks = await uow.maintenanceTasks.findByStatus(status as any);
    } else if (assignedTo) {
      tasks = await uow.maintenanceTasks.findByAssignee(assignedTo);
    } else {
      tasks = await uow.maintenanceTasks.findAll(limit, offset);
    }

    const total = await uow.maintenanceTasks.count();

    return NextResponse.json({
      success: true,
      data: tasks,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + tasks.length < total
      }
    });
  } catch (error) {
    console.error('GET /api/maintenance-tasks error:', error);
    
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
 * POST /api/maintenance-tasks - Create new maintenance task
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = MaintenanceTaskSchema.parse(body);

    const uow = getUnitOfWork();
    const task = await uow.maintenanceTasks.create(validatedData);

    return NextResponse.json({
      success: true,
      data: task
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/maintenance-tasks error:', error);

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
