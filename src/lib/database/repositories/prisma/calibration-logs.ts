import { PrismaClient } from '@/generated/prisma';
import { v4 as uuidv4 } from 'uuid';
import type { CalibrationLog } from '@/lib/types';
import type { CalibrationLogRepository } from '../../interfaces';
import { DatabaseError } from '../../interfaces';

const prisma = new PrismaClient();

export class PrismaCalibrationLogRepository implements CalibrationLogRepository {
  async findById(id: string): Promise<CalibrationLog | null> {
    try {
      const log = await prisma.calibration_logs.findUnique({ where: { id } });
      return log ? this.mapToCalibrationLog(log) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find calibration log by id: ${error}`);
    }
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<CalibrationLog[]> {
    try {
      const logs = await prisma.calibration_logs.findMany({
        skip: offset,
        take: limit,
        orderBy: { date: 'desc' },
      });
      return logs.map(this.mapToCalibrationLog);
    } catch (error) {
      throw new DatabaseError(`Failed to find all calibration logs: ${error}`);
    }
  }

  async create(item: Omit<CalibrationLog, 'id'>): Promise<CalibrationLog> {
    try {
      const created = await prisma.calibration_logs.create({
        data: {
          id: uuidv4(),
          metrology_tool_id: item.metrologyToolId,
          date: item.date,
          performed_by: item.performedBy,
          notes: item.notes ?? null,
          result: item.result,
          certificate_url: item.certificateUrl ?? null,
          next_due_date: item.nextDueDate ?? null,
        },
      });
      return this.mapToCalibrationLog(created);
    } catch (error: any) {
      throw new DatabaseError(`Failed to create calibration log: ${error.message}`);
    }
  }

  async update(id: string, item: Partial<CalibrationLog>): Promise<CalibrationLog | null> {
    try {
      const updated = await prisma.calibration_logs.update({
        where: { id },
        data: {
          metrology_tool_id: item.metrologyToolId,
          date: item.date,
          performed_by: item.performedBy,
          notes: item.notes,
          result: item.result,
          certificate_url: item.certificateUrl,
          next_due_date: item.nextDueDate,
        },
      });
      return this.mapToCalibrationLog(updated);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return null;
      }
      throw new DatabaseError(`Failed to update calibration log: ${error.message}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.calibration_logs.delete({ where: { id } });
      return true;
    } catch (error: any) {
      if (error.code === 'P2025') {
        return false;
      }
      throw new DatabaseError(`Failed to delete calibration log: ${error}`);
    }
  }

  async count(): Promise<number> {
    try {
      return await prisma.calibration_logs.count();
    } catch (error) {
      throw new DatabaseError(`Failed to count calibration logs: ${error}`);
    }
  }

  async findByToolId(toolId: string): Promise<CalibrationLog[]> {
    try {
      const logs = await prisma.calibration_logs.findMany({
        where: { metrology_tool_id: toolId },
        orderBy: { date: 'desc' },
      });
      return logs.map(this.mapToCalibrationLog);
    } catch (error) {
      throw new DatabaseError(`Failed to find calibration logs by toolId: ${error}`);
    }
  }

  async findByDateRange(startDate: string, endDate: string): Promise<CalibrationLog[]> {
    try {
      const logs = await prisma.calibration_logs.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: 'desc' },
      });
      return logs.map(this.mapToCalibrationLog);
    } catch (error) {
      throw new DatabaseError(`Failed to find calibration logs by date range: ${error}`);
    }
  }

  async findByPerformer(performedBy: string): Promise<CalibrationLog[]> {
    try {
      const logs = await prisma.calibration_logs.findMany({
        where: { performed_by: performedBy },
        orderBy: { date: 'desc' },
      });
      return logs.map(this.mapToCalibrationLog);
    } catch (error) {
      throw new DatabaseError(`Failed to find calibration logs by performer: ${error}`);
    }
  }

  private mapToCalibrationLog(row: any): CalibrationLog {
    return {
      id: row.id,
      metrologyToolId: row.metrology_tool_id,
      date: row.date,
      performedBy: row.performed_by,
      notes: row.notes ?? undefined,
      result: row.result,
      certificateUrl: row.certificate_url ?? undefined,
      nextDueDate: row.next_due_date ?? undefined,
    };
  }
}
