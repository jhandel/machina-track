import { NextRequest, NextResponse } from 'next/server';
import { getUnitOfWork } from '@/lib/database/repositories';
import { DatabaseError } from '@/lib/database/interfaces';
import { z } from 'zod';

// Validation schema for maintenance task updates
const UpdateMaintenanceTaskSchema = z.object({
  equipmentId: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  frequencyDays: z.number().int().min(1).optional(),
  lastPerformedDate: z.string().optional(),
  nextDueDate: z.string().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue', 'skipped']).optional(),
  partsUsed: z.array(z.object({
    partName: z.string(),
    quantity: z.number().int().min(1)
  })).optional(),
});

/**
 * GET /api/maintenance-tasks/[id] - Get maintenance task by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const uow = getUnitOfWork();
    const task = await uow.maintenanceTasks.findById(id);

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Maintenance task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error(`GET /api/maintenance-tasks/${params.id} error:`, error);
    
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
 * PUT /api/maintenance-tasks/[id] - Update maintenance task
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Validate input
    const validatedData = UpdateMaintenanceTaskSchema.parse(body);

    const uow = getUnitOfWork();
    
    // Check if task exists
    const existingTask = await uow.maintenanceTasks.findById(id);
    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Maintenance task not found' },
        { status: 404 }
      );
    }
    var scheduleNext = false;
    if((existingTask.status != 'completed') && (validatedData.status === 'completed') && ((validatedData.frequencyDays) && (validatedData.frequencyDays > 0))) {
      // If the task is being marked as completed, schedule the next occurrence
      scheduleNext = true;
    }

    const updatedTask = await uow.maintenanceTasks.update(id, validatedData);

    if (scheduleNext) {
      // If the task is completed, schedule the next occurrence
      const nextDueDate = new Date();
      nextDueDate.setDate(nextDueDate.getDate() + (validatedData.frequencyDays || 30)); // Default to 30 days if not specified
      //clone the current task and set the next due date
      const nextTask = {
        ...updatedTask,
        id: undefined, // Clear ID to create a new task
        lastPerformedDate: validatedData.lastPerformedDate, // Set last performed date to current next
        nextDueDate: nextDueDate.toISOString().split('T')[0], // Set next due date
        status: z.enum(['pending', 'in_progress', 'completed', 'overdue', 'skipped']).parse('pending'), // Reset status to pending for the new task
        partsUsed: [], // Clear parts used for the new task
    }
      await uow.maintenanceTasks.create(nextTask);
    }

    return NextResponse.json({
      success: true,
      data: updatedTask
    });
  } catch (error) {
    console.error(`PUT /api/maintenance-tasks/${params.id} error:`, error);

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

/**
 * DELETE /api/maintenance-tasks/[id] - Delete maintenance task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const uow = getUnitOfWork();
    
    // Check if task exists
    const existingTask = await uow.maintenanceTasks.findById(id);
    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Maintenance task not found' },
        { status: 404 }
      );
    }

    await uow.maintenanceTasks.delete(id);

    return NextResponse.json({
      success: true,
      message: 'Maintenance task deleted successfully'
    });
  } catch (error) {
    console.error(`DELETE /api/maintenance-tasks/${params.id} error:`, error);
    
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
