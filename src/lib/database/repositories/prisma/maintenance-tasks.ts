import { PrismaClient } from '@/generated/prisma';
import { v4 as uuidv4 } from 'uuid';
import type { MaintenanceTask } from '@/lib/types';
import type { MaintenanceTaskRepository } from '../../interfaces';
import { DatabaseError } from '../../interfaces';

const prisma = new PrismaClient();

export class PrismaMaintenanceTaskRepository implements MaintenanceTaskRepository {
  async findById(id: string): Promise<MaintenanceTask | null> {
    try {
      const task = await prisma.maintenance_tasks.findUnique({ where: { id } });
      return task ? this.mapToMaintenanceTask(task) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find maintenance task by id: ${error}`);
    }
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<MaintenanceTask[]> {
    try {
      const tasks = await prisma.maintenance_tasks.findMany({
        skip: offset,
        take: limit,
        orderBy: { updated_at: 'desc' },
      });
      return tasks.map(this.mapToMaintenanceTask);
    } catch (error) {
      throw new DatabaseError(`Failed to find all maintenance tasks: ${error}`);
    }
  }

  async create(item: Omit<MaintenanceTask, 'id'>): Promise<MaintenanceTask> {
    try {
      const created = await prisma.maintenance_tasks.create({
        data: {
          id: uuidv4(),
          equipment_id: item.equipmentId,
          description: item.description,
          frequency_days: item.frequencyDays ?? null,
          last_performed_date: item.lastPerformedDate ?? null,
          next_due_date: item.nextDueDate ?? null,
          assigned_to: item.assignedTo ?? null,
          notes: item.notes ?? null,
          status: item.status,
        },
      });
      return this.mapToMaintenanceTask(created);
    } catch (error: any) {
      throw new DatabaseError(`Failed to create maintenance task: ${error.message}`);
    }
  }

  async update(id: string, item: Partial<MaintenanceTask>): Promise<MaintenanceTask | null> {
    try {
      const updated = await prisma.maintenance_tasks.update({
        where: { id },
        data: {
          equipment_id: item.equipmentId,
          description: item.description,
          frequency_days: item.frequencyDays,
          last_performed_date: item.lastPerformedDate,
          next_due_date: item.nextDueDate,
          assigned_to: item.assignedTo,
          notes: item.notes,
          status: item.status,
        },
      });
      return this.mapToMaintenanceTask(updated);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return null;
      }
      throw new DatabaseError(`Failed to update maintenance task: ${error.message}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.maintenance_tasks.delete({ where: { id } });
      return true;
    } catch (error: any) {
      if (error.code === 'P2025') {
        return false;
      }
      throw new DatabaseError(`Failed to delete maintenance task: ${error}`);
    }
  }

  async count(): Promise<number> {
    try {
      return await prisma.maintenance_tasks.count();
    } catch (error) {
      throw new DatabaseError(`Failed to count maintenance tasks: ${error}`);
    }
  }

  async findByEquipmentId(equipmentId: string): Promise<MaintenanceTask[]> {
    try {
      const tasks = await prisma.maintenance_tasks.findMany({
        where: { equipment_id: equipmentId },
        orderBy: { updated_at: 'desc' },
      });
      return tasks.map(this.mapToMaintenanceTask);
    } catch (error) {
      throw new DatabaseError(`Failed to find maintenance tasks by equipmentId: ${error}`);
    }
  }

  async findByStatus(status: MaintenanceTask['status']): Promise<MaintenanceTask[]> {
    try {
      const tasks = await prisma.maintenance_tasks.findMany({
        where: { status },
        orderBy: { updated_at: 'desc' },
      });
      return tasks.map(this.mapToMaintenanceTask);
    } catch (error) {
      throw new DatabaseError(`Failed to find maintenance tasks by status: ${error}`);
    }
  }

  async findUpcoming(days: number = 7): Promise<MaintenanceTask[]> {
    try {
      const now = new Date();
      const future = new Date();
      future.setDate(now.getDate() + days);
      const nowStr = now.toISOString();
      const futureStr = future.toISOString();
      const tasks = await prisma.maintenance_tasks.findMany({
        where: {
          next_due_date: {
            gte: nowStr,
            lte: futureStr,
          },
        },
        orderBy: { next_due_date: 'asc' },
      });
      return tasks.map(this.mapToMaintenanceTask);
    } catch (error) {
      throw new DatabaseError(`Failed to find upcoming maintenance tasks: ${error}`);
    }
  }

  async findOverdue(date?: string): Promise<MaintenanceTask[]> {
    try {
      const compareDate = date || new Date().toISOString();
      const tasks = await prisma.maintenance_tasks.findMany({
        where: {
          next_due_date: { lt: compareDate },
          status: { not: 'completed' },
        },
        orderBy: { next_due_date: 'asc' },
      });
      return tasks.map(this.mapToMaintenanceTask);
    } catch (error) {
      throw new DatabaseError(`Failed to find overdue maintenance tasks: ${error}`);
    }
  }

  async findByAssignee(assignedTo: string): Promise<MaintenanceTask[]> {
    try {
      const tasks = await prisma.maintenance_tasks.findMany({
        where: { assigned_to: assignedTo },
        orderBy: { updated_at: 'desc' },
      });
      return tasks.map(this.mapToMaintenanceTask);
    } catch (error) {
      throw new DatabaseError(`Failed to find maintenance tasks by assignee: ${error}`);
    }
  }

  async search(query: string): Promise<MaintenanceTask[]> {
    try {
      const tasks = await prisma.maintenance_tasks.findMany({
        where: {
          OR: [
            { description: { contains: query } },
            { notes: { contains: query } },
            { assigned_to: { contains: query } },
          ],
        },
        orderBy: { updated_at: 'desc' },
      });
      return tasks.map(this.mapToMaintenanceTask);
    } catch (error) {
      throw new DatabaseError(`Failed to search maintenance tasks: ${error}`);
    }
  }

  private mapToMaintenanceTask(row: any): MaintenanceTask {
    return {
      id: row.id,
      equipmentId: row.equipment_id,
      description: row.description,
      frequencyDays: row.frequency_days ?? undefined,
      lastPerformedDate: row.last_performed_date ?? undefined,
      nextDueDate: row.next_due_date ?? undefined,
      assignedTo: row.assigned_to ?? undefined,
      notes: row.notes ?? undefined,
      status: row.status,
      partsUsed: undefined, // Not implemented: join with maintenance_parts if needed
      serviceRecordIds: undefined, // Not implemented: join with service_records if needed
    };
  }
}
