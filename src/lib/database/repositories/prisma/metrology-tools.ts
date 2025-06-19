import { getPrismaClient } from "../../prisma-client";
import { v4 as uuidv4 } from 'uuid';
import type { MetrologyTool } from '@/lib/types';
import type { MetrologyToolRepository } from '../../interfaces';
import { DatabaseError } from '../../interfaces';


export class PrismaMetrologyToolRepository implements MetrologyToolRepository {
  async findById(id: string): Promise<MetrologyTool | null> {
    const prisma = await getPrismaClient();
    try {
      const tool = await prisma.metrology_tools.findUnique({
        where: { id },
        include: {
          metrology_tool_types: true,
          manufacturers: true,
          locations: true,
        },
      });
      return tool ? this.mapToMetrologyTool(tool) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find metrology tool by id: ${error}`);
    }
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<MetrologyTool[]> {
    const prisma = await getPrismaClient();
    try {
      const tools = await prisma.metrology_tools.findMany({
        skip: offset,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          metrology_tool_types: true,
          manufacturers: true,
          locations: true,
        },
      });
      return tools.map(this.mapToMetrologyTool);
    } catch (error) {
      throw new DatabaseError(`Failed to find all metrology tools: ${error}`);
    }
  }

  async create(item: Omit<MetrologyTool, 'id'>): Promise<MetrologyTool> {
    const prisma = await getPrismaClient();
    try {
      const created = await prisma.metrology_tools.create({
        data: {
          id: uuidv4(),
          name: item.name,
          type_id: item.typeId,
          serial_number: item.serialNumber,
          manufacturer_id: item.manufacturerId ?? null,
          calibration_interval_days: item.calibrationIntervalDays,
          last_calibration_date: item.lastCalibrationDate ?? null,
          next_calibration_date: item.nextCalibrationDate ?? null,
          location_id: item.locationId ?? null,
          status: item.status,
          image_url: item.imageUrl ?? null,
          notes: item.notes ?? null,
        },
        include: {
          metrology_tool_types: true,
          manufacturers: true,
          locations: true,
        },
      });
      return this.mapToMetrologyTool(created);
    } catch (error: any) {
      throw new DatabaseError(`Failed to create metrology tool: ${error.message}`);
    }
  }

  async update(id: string, item: Partial<MetrologyTool>): Promise<MetrologyTool | null> {
    const prisma = await getPrismaClient();
    try {
      const updated = await prisma.metrology_tools.update({
        where: { id },
        data: {
          name: item.name,
          type_id: item.typeId,
          serial_number: item.serialNumber,
          manufacturer_id: item.manufacturerId,
          calibration_interval_days: item.calibrationIntervalDays,
          last_calibration_date: item.lastCalibrationDate,
          next_calibration_date: item.nextCalibrationDate,
          location_id: item.locationId,
          status: item.status,
          image_url: item.imageUrl,
          notes: item.notes,
        },
        include: {
          metrology_tool_types: true,
          manufacturers: true,
          locations: true,
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
    const prisma = await getPrismaClient();
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
    const prisma = await getPrismaClient();
    try {
      return await prisma.metrology_tools.count();
    } catch (error) {
      throw new DatabaseError(`Failed to count metrology tools: ${error}`);
    }
  }

  async findByStatus(status: MetrologyTool['status']): Promise<MetrologyTool[]> {
    const prisma = await getPrismaClient();
    try {
      const tools = await prisma.metrology_tools.findMany({
        where: { status },
        orderBy: { name: 'asc' },
        include: {
          metrology_tool_types: true,
          manufacturers: true,
          locations: true,
        },
      });
      return tools.map(this.mapToMetrologyTool);
    } catch (error) {
      throw new DatabaseError(`Failed to find metrology tools by status: ${error}`);
    }
  }

  async findDueForCalibration(date?: string): Promise<MetrologyTool[]> {
    const prisma = await getPrismaClient();
    try {
      const compareDate = date || new Date().toISOString();
      const tools = await prisma.metrology_tools.findMany({
        where: {
          next_calibration_date: { lte: compareDate },
          status: { not: 'out_of_calibration' },
        },
        orderBy: { next_calibration_date: 'asc' },
        include: {
          metrology_tool_types: true,
          manufacturers: true,
          locations: true,
        },
      });
      return tools.map(this.mapToMetrologyTool);
    } catch (error) {
      throw new DatabaseError(`Failed to find due for calibration: ${error}`);
    }
  }

  async findOverdueCalibration(date?: string): Promise<MetrologyTool[]> {
    const prisma = await getPrismaClient();
    try {
      const compareDate = date || new Date().toISOString();
      const tools = await prisma.metrology_tools.findMany({
        where: {
          next_calibration_date: { lt: compareDate },
          status: { not: 'out_of_calibration' },
        },
        orderBy: { next_calibration_date: 'asc' },
        include: {
          metrology_tool_types: true,
          manufacturers: true,
          locations: true,
        },
      });
      return tools.map(this.mapToMetrologyTool);
    } catch (error) {
      throw new DatabaseError(`Failed to find overdue calibration: ${error}`);
    }
  }

  async findBySerialNumber(serialNumber: string): Promise<MetrologyTool | null> {
    const prisma = await getPrismaClient();
    try {
      const tool = await prisma.metrology_tools.findFirst({
        where: { serial_number: serialNumber },
        include: {
          metrology_tool_types: true,
          manufacturers: true,
          locations: true,
        },
      });
      return tool ? this.mapToMetrologyTool(tool) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find metrology tool by serial number: ${error}`);
    }
  }

  async search(query: string): Promise<MetrologyTool[]> {
    const prisma = await getPrismaClient();
    try {
      const tools = await prisma.metrology_tools.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { metrology_tool_types: { name: { contains: query } } },
            { serial_number: { contains: query } },
            { notes: { contains: query } },
          ],
        },
        orderBy: { name: 'asc' },
        include: {
          metrology_tool_types: true,
          manufacturers: true,
          locations: true,
        },
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
      typeId: row.type_id,
      type: row.metrology_tool_types?.name,
      serialNumber: row.serial_number,
      manufacturerId: row.manufacturer_id,
      manufacturer: row.manufacturers?.name,
      calibrationIntervalDays: row.calibration_interval_days,
      lastCalibrationDate: row.last_calibration_date ?? undefined,
      nextCalibrationDate: row.next_calibration_date ?? undefined,
      calibrationLogIds: [], // Not implemented: join with calibration_logs if needed
      locationId: row.location_id,
      location: row.locations?.name,
      status: row.status,
      imageUrl: row.image_url ?? undefined,
      notes: row.notes ?? undefined,
    };
  }
}
