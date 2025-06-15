import { PrismaClient } from '@/generated/prisma';
import { v4 as uuidv4 } from 'uuid';
import type { MetrologyTool } from '@/lib/types';
import type { MetrologyToolRepository } from '../../interfaces';
import { DatabaseError } from '../../interfaces';

const prisma = new PrismaClient();

export class PrismaMetrologyToolRepository implements MetrologyToolRepository {
  async findById(id: string): Promise<MetrologyTool | null> {
    try {
      const tool = await prisma.metrology_tools.findUnique({ where: { id } });
      return tool ? this.mapToMetrologyTool(tool) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find metrology tool by id: ${error}`);
    }
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<MetrologyTool[]> {
    try {
      const tools = await prisma.metrology_tools.findMany({
        skip: offset,
        take: limit,
        orderBy: { name: 'asc' },
      });
      return tools.map(this.mapToMetrologyTool);
    } catch (error) {
      throw new DatabaseError(`Failed to find all metrology tools: ${error}`);
    }
  }

  async create(item: Omit<MetrologyTool, 'id'>): Promise<MetrologyTool> {
    try {
      const created = await prisma.metrology_tools.create({
        data: {
          id: uuidv4(),
          name: item.name,
          type: item.type,
          serial_number: item.serialNumber,
          manufacturer: item.manufacturer ?? null,
          calibration_interval_days: item.calibrationIntervalDays,
          last_calibration_date: item.lastCalibrationDate ?? null,
          next_calibration_date: item.nextCalibrationDate ?? null,
          location: item.location ?? null,
          status: item.status,
          image_url: item.imageUrl ?? null,
          notes: item.notes ?? null,
        },
      });
      return this.mapToMetrologyTool(created);
    } catch (error: any) {
      throw new DatabaseError(`Failed to create metrology tool: ${error.message}`);
    }
  }

  async update(id: string, item: Partial<MetrologyTool>): Promise<MetrologyTool | null> {
    try {
      const updated = await prisma.metrology_tools.update({
        where: { id },
        data: {
          name: item.name,
          type: item.type,
          serial_number: item.serialNumber,
          manufacturer: item.manufacturer,
          calibration_interval_days: item.calibrationIntervalDays,
          last_calibration_date: item.lastCalibrationDate,
          next_calibration_date: item.nextCalibrationDate,
          location: item.location,
          status: item.status,
          image_url: item.imageUrl,
          notes: item.notes,
        },
      });
      return this.mapToMetrologyTool(updated);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return null;
      }
      throw new DatabaseError(`Failed to update metrology tool: ${error.message}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.metrology_tools.delete({ where: { id } });
      return true;
    } catch (error: any) {
      if (error.code === 'P2025') {
        return false;
      }
      throw new DatabaseError(`Failed to delete metrology tool: ${error}`);
    }
  }

  async count(): Promise<number> {
    try {
      return await prisma.metrology_tools.count();
    } catch (error) {
      throw new DatabaseError(`Failed to count metrology tools: ${error}`);
    }
  }

  async findByStatus(status: MetrologyTool['status']): Promise<MetrologyTool[]> {
    try {
      const tools = await prisma.metrology_tools.findMany({
        where: { status },
        orderBy: { name: 'asc' },
      });
      return tools.map(this.mapToMetrologyTool);
    } catch (error) {
      throw new DatabaseError(`Failed to find metrology tools by status: ${error}`);
    }
  }

  async findDueForCalibration(date?: string): Promise<MetrologyTool[]> {
    try {
      const compareDate = date || new Date().toISOString();
      const tools = await prisma.metrology_tools.findMany({
        where: {
          next_calibration_date: { lte: compareDate },
          status: { not: 'out_of_service' },
        },
        orderBy: { next_calibration_date: 'asc' },
      });
      return tools.map(this.mapToMetrologyTool);
    } catch (error) {
      throw new DatabaseError(`Failed to find due for calibration: ${error}`);
    }
  }

  async findOverdueCalibration(date?: string): Promise<MetrologyTool[]> {
    try {
      const compareDate = date || new Date().toISOString();
      const tools = await prisma.metrology_tools.findMany({
        where: {
          next_calibration_date: { lt: compareDate },
          status: { not: 'out_of_service' },
        },
        orderBy: { next_calibration_date: 'asc' },
      });
      return tools.map(this.mapToMetrologyTool);
    } catch (error) {
      throw new DatabaseError(`Failed to find overdue calibration: ${error}`);
    }
  }

  async findBySerialNumber(serialNumber: string): Promise<MetrologyTool | null> {
    try {
      const tool = await prisma.metrology_tools.findFirst({ where: { serial_number: serialNumber } });
      return tool ? this.mapToMetrologyTool(tool) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find metrology tool by serial number: ${error}`);
    }
  }

  async search(query: string): Promise<MetrologyTool[]> {
    try {
      const tools = await prisma.metrology_tools.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { type: { contains: query } },
            { serial_number: { contains: query } },
            { notes: { contains: query } },
          ],
        },
        orderBy: { name: 'asc' },
      });
      return tools.map(this.mapToMetrologyTool);
    } catch (error) {
      throw new DatabaseError(`Failed to search metrology tools: ${error}`);
    }
  }

  private mapToMetrologyTool(row: any): MetrologyTool {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      serialNumber: row.serial_number,
      manufacturer: row.manufacturer ?? undefined,
      calibrationIntervalDays: row.calibration_interval_days,
      lastCalibrationDate: row.last_calibration_date ?? undefined,
      nextCalibrationDate: row.next_calibration_date ?? undefined,
      calibrationLogIds: [], // Not implemented: join with calibration_logs if needed
      location: row.location ?? undefined,
      status: row.status,
      imageUrl: row.image_url ?? undefined,
      notes: row.notes ?? undefined,
    };
  }
}
