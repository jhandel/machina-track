import { PrismaClient } from '@/generated/prisma';
import { v4 as uuidv4 } from 'uuid';
import type { MachineLogEntry } from '@/lib/types';
import type { MachineLogRepository } from '../../interfaces';
import { DatabaseError } from '../../interfaces';

const prisma = new PrismaClient();

export class PrismaMachineLogRepository implements MachineLogRepository {
  async findById(id: string): Promise<MachineLogEntry | null> {
    try {
      const entry = await prisma.machine_log_entries.findUnique({ where: { id } });
      return entry ? this.mapToMachineLogEntry(entry) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find machine log entry by id: ${error}`);
    }
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<MachineLogEntry[]> {
    try {
      const entries = await prisma.machine_log_entries.findMany({
        skip: offset,
        take: limit,
        orderBy: { timestamp: 'desc' },
      });
      return entries.map(this.mapToMachineLogEntry);
    } catch (error) {
      throw new DatabaseError(`Failed to find all machine log entries: ${error}`);
    }
  }

  async create(item: Omit<MachineLogEntry, 'id'>): Promise<MachineLogEntry> {
    try {
      const created = await prisma.machine_log_entries.create({
        data: {
          id: uuidv4(),
          equipment_id: item.equipmentId,
          timestamp: item.timestamp,
          error_code: item.errorCode ?? null,
          metric_name: item.metricName,
          metric_value: String(item.metricValue),
          notes: item.notes ?? null,
        },
      });
      return this.mapToMachineLogEntry(created);
    } catch (error: any) {
      throw new DatabaseError(`Failed to create machine log entry: ${error.message}`);
    }
  }

  async update(id: string, item: Partial<MachineLogEntry>): Promise<MachineLogEntry | null> {
    try {
      const updated = await prisma.machine_log_entries.update({
        where: { id },
        data: {
          equipment_id: item.equipmentId,
          timestamp: item.timestamp,
          error_code: item.errorCode,
          metric_name: item.metricName,
          metric_value: item.metricValue !== undefined ? String(item.metricValue) : undefined,
          notes: item.notes,
        },
      });
      return this.mapToMachineLogEntry(updated);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return null;
      }
      throw new DatabaseError(`Failed to update machine log entry: ${error.message}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.machine_log_entries.delete({ where: { id } });
      return true;
    } catch (error: any) {
      if (error.code === 'P2025') {
        return false;
      }
      throw new DatabaseError(`Failed to delete machine log entry: ${error}`);
    }
  }

  async count(): Promise<number> {
    try {
      return await prisma.machine_log_entries.count();
    } catch (error) {
      throw new DatabaseError(`Failed to count machine log entries: ${error}`);
    }
  }

  async findByEquipmentId(equipmentId: string, limit: number = 100): Promise<MachineLogEntry[]> {
    try {
      const entries = await prisma.machine_log_entries.findMany({
        where: { equipment_id: equipmentId },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
      return entries.map(this.mapToMachineLogEntry);
    } catch (error) {
      throw new DatabaseError(`Failed to find machine log entries by equipmentId: ${error}`);
    }
  }

  async findByDateRange(equipmentId: string, startDate: string, endDate: string): Promise<MachineLogEntry[]> {
    try {
      const entries = await prisma.machine_log_entries.findMany({
        where: {
          equipment_id: equipmentId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { timestamp: 'desc' },
      });
      return entries.map(this.mapToMachineLogEntry);
    } catch (error) {
      throw new DatabaseError(`Failed to find machine log entries by date range: ${error}`);
    }
  }

  async findByErrorCode(errorCode: string): Promise<MachineLogEntry[]> {
    try {
      const entries = await prisma.machine_log_entries.findMany({
        where: { error_code: errorCode },
        orderBy: { timestamp: 'desc' },
      });
      return entries.map(this.mapToMachineLogEntry);
    } catch (error) {
      throw new DatabaseError(`Failed to find machine log entries by error code: ${error}`);
    }
  }

  async findByMetric(metricName: string): Promise<MachineLogEntry[]> {
    try {
      const entries = await prisma.machine_log_entries.findMany({
        where: { metric_name: metricName },
        orderBy: { timestamp: 'desc' },
      });
      return entries.map(this.mapToMachineLogEntry);
    } catch (error) {
      throw new DatabaseError(`Failed to find machine log entries by metric: ${error}`);
    }
  }

  async findRecentLogs(equipmentId: string, hours: number = 24): Promise<MachineLogEntry[]> {
    try {
      const sinceDate = new Date();
      sinceDate.setHours(sinceDate.getHours() - hours);
      const sinceDateStr = sinceDate.toISOString();
      const entries = await prisma.machine_log_entries.findMany({
        where: {
          equipment_id: equipmentId,
          timestamp: {
            gte: sinceDateStr,
          },
        },
        orderBy: { timestamp: 'desc' },
      });
      return entries.map(this.mapToMachineLogEntry);
    } catch (error) {
      throw new DatabaseError(`Failed to find recent machine log entries: ${error}`);
    }
  }

  private mapToMachineLogEntry(row: any): MachineLogEntry {
    // Parse metric value back to number if it's a numeric string
    let metricValue: string | number = row.metric_value;
    const numericValue = Number(row.metric_value);
    if (!isNaN(numericValue) && isFinite(numericValue)) {
      metricValue = numericValue;
    }
    return {
      id: row.id,
      equipmentId: row.equipment_id,
      timestamp: row.timestamp,
      errorCode: row.error_code,
      metricName: row.metric_name,
      metricValue: metricValue,
      notes: row.notes,
    };
  }
}
