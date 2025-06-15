import { getPrismaClient } from "../../prisma-client";
import { v4 as uuidv4 } from 'uuid';
import type { ServiceRecord } from '@/lib/types';
import type { ServiceRecordRepository } from '../../interfaces';
import { DatabaseError } from '../../interfaces';


export class PrismaServiceRecordRepository implements ServiceRecordRepository {
  async findById(id: string): Promise<ServiceRecord | null> {
      const prisma = await getPrismaClient();
    try {
      const record = await prisma.service_records.findUnique({ where: { id } });
      return record ? this.mapToServiceRecord(record) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find service record by id: ${error}`);
    }
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<ServiceRecord[]> {
      const prisma = await getPrismaClient();
    try {
      const records = await prisma.service_records.findMany({
        skip: offset,
        take: limit,
        orderBy: { date: 'desc' },
      });
      return records.map(this.mapToServiceRecord);
    } catch (error) {
      throw new DatabaseError(`Failed to find all service records: ${error}`);
    }
  }

  async create(item: Omit<ServiceRecord, 'id'>): Promise<ServiceRecord> {
      const prisma = await getPrismaClient();
    try {
      const created = await prisma.service_records.create({
        data: {
          id: uuidv4(),
          maintenance_task_id: item.maintenanceTaskId,
          date: item.date,
          performed_by: item.performedBy,
          description_of_work: item.descriptionOfWork,
          cost: item.cost ?? null,
          notes: item.notes ?? null,
        },
      });
      return this.mapToServiceRecord(created);
    } catch (error: any) {
      throw new DatabaseError(`Failed to create service record: ${error.message}`);
    }
  }

  async update(id: string, item: Partial<ServiceRecord>): Promise<ServiceRecord | null> {
      const prisma = await getPrismaClient();
    try {
      const updated = await prisma.service_records.update({
        where: { id },
        data: {
          maintenance_task_id: item.maintenanceTaskId,
          date: item.date,
          performed_by: item.performedBy,
          description_of_work: item.descriptionOfWork,
          cost: item.cost,
          notes: item.notes,
        },
      });
      return this.mapToServiceRecord(updated);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return null;
      }
      throw new DatabaseError(`Failed to update service record: ${error.message}`);
    }
  }

  async delete(id: string): Promise<boolean> {
      const prisma = await getPrismaClient();
    try {
      await prisma.service_records.delete({ where: { id } });
      return true;
    } catch (error: any) {
      if (error.code === 'P2025') {
        return false;
      }
      throw new DatabaseError(`Failed to delete service record: ${error}`);
    }
  }

  async count(): Promise<number> {
      const prisma = await getPrismaClient();
    try {
      return await prisma.service_records.count();
    } catch (error) {
      throw new DatabaseError(`Failed to count service records: ${error}`);
    }
  }

  async findByTaskId(taskId: string): Promise<ServiceRecord[]> {
      const prisma = await getPrismaClient();
    try {
      const records = await prisma.service_records.findMany({
        where: { maintenance_task_id: taskId },
        orderBy: { date: 'desc' },
      });
      return records.map(this.mapToServiceRecord);
    } catch (error) {
      throw new DatabaseError(`Failed to find service records by taskId: ${error}`);
    }
  }

  async findByPerformer(performedBy: string): Promise<ServiceRecord[]> {
      const prisma = await getPrismaClient();
    try {
      const records = await prisma.service_records.findMany({
        where: { performed_by: performedBy },
        orderBy: { date: 'desc' },
      });
      return records.map(this.mapToServiceRecord);
    } catch (error) {
      throw new DatabaseError(`Failed to find service records by performer: ${error}`);
    }
  }

  async findByDateRange(startDate: string, endDate: string): Promise<ServiceRecord[]> {
      const prisma = await getPrismaClient();
    try {
      const records = await prisma.service_records.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: 'desc' },
      });
      return records.map(this.mapToServiceRecord);
    } catch (error) {
      throw new DatabaseError(`Failed to find service records by date range: ${error}`);
    }
  }

  async findByEquipmentId(equipmentId: string): Promise<ServiceRecord[]> {
      const prisma = await getPrismaClient();
    try {
      const records = await prisma.service_records.findMany({
        where: { maintenance_tasks: { equipment_id: equipmentId } },
        orderBy: { date: 'desc' },
        include: { maintenance_tasks: true },
      });
      return records.map(this.mapToServiceRecord);
    } catch (error) {
      throw new DatabaseError(`Failed to find service records by equipmentId: ${error}`);
    }
  }

  private mapToServiceRecord(row: any): ServiceRecord {
    return {
      id: row.id,
      maintenanceTaskId: row.maintenance_task_id,
      date: row.date,
      performedBy: row.performed_by,
      descriptionOfWork: row.description_of_work,
      cost: row.cost ?? undefined,
      notes: row.notes ?? undefined,
      attachments: undefined, // Not implemented: join with service_record_attachments if needed
    };
  }
}
