import { v4 as uuidv4 } from 'uuid';
import type { CuttingTool } from '@/lib/types';
import type { CuttingToolRepository } from '../../interfaces';
import { DatabaseError, NotFoundError } from '../../interfaces';
import { getPrismaClient } from '../../prisma-client';

export class PrismaCuttingToolRepository implements CuttingToolRepository {
  async findById(id: string): Promise<CuttingTool | null> {
      const prisma = await getPrismaClient();
    try {
      const prisma = await getPrismaClient();
      const tool = await prisma.cutting_tools.findUnique({ where: { id } });
      return tool ? this.mapToCuttingTool(tool) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find cutting tool by id: ${error}`);
    }
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<CuttingTool[]> {
      const prisma = await getPrismaClient();
    try {
      const prisma = await getPrismaClient();
      const tools = await prisma.cutting_tools.findMany({
        skip: offset,
        take: limit,
        orderBy: { updated_at: 'desc' },
      });
      return tools.map(this.mapToCuttingTool);
    } catch (error) {
      throw new DatabaseError(`Failed to find all cutting tools: ${error}`);
    }
  }

  async create(item: Omit<CuttingTool, 'id'>): Promise<CuttingTool> {
      const prisma = await getPrismaClient();
    try {
      const prisma = await getPrismaClient();
      const created = await prisma.cutting_tools.create({
        data: {
          id: uuidv4(),
          name: item.name,
          type: item.type,
          material: item.material ?? null,
          size: item.size ?? null,
          quantity: item.quantity,
          min_quantity: item.minQuantity,
          location: item.location,
          tool_life_hours: item.toolLifeHours ?? null,
          remaining_tool_life_hours: item.remainingToolLifeHours ?? null,
          last_used_date: item.lastUsedDate ?? null,
          end_of_life_date: item.endOfLifeDate ?? null,
          supplier: item.supplier ?? null,
          cost_per_unit: item.costPerUnit ?? null,
          image_url: item.imageUrl ?? null,
          notes: item.notes ?? null,
        },
      });
      return this.mapToCuttingTool(created);
    } catch (error: any) {
      throw new DatabaseError(`Failed to create cutting tool: ${error.message}`);
    }
  }

  async update(id: string, item: Partial<CuttingTool>): Promise<CuttingTool | null> {
      const prisma = await getPrismaClient();
    try {
      const updated = await prisma.cutting_tools.update({
        where: { id },
        data: {
          name: item.name,
          type: item.type,
          material: item.material,
          size: item.size,
          quantity: item.quantity,
          min_quantity: item.minQuantity,
          location: item.location,
          tool_life_hours: item.toolLifeHours,
          remaining_tool_life_hours: item.remainingToolLifeHours,
          last_used_date: item.lastUsedDate,
          end_of_life_date: item.endOfLifeDate,
          supplier: item.supplier,
          cost_per_unit: item.costPerUnit,
          image_url: item.imageUrl,
          notes: item.notes,
        },
      });
      return this.mapToCuttingTool(updated);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return null;
      }
      throw new DatabaseError(`Failed to update cutting tool: ${error.message}`);
    }
  }

  async delete(id: string): Promise<boolean> {
      const prisma = await getPrismaClient();
    try {
      await prisma.cutting_tools.delete({ where: { id } });
      return true;
    } catch (error: any) {
      if (error.code === 'P2025') {
        return false;
      }
      throw new DatabaseError(`Failed to delete cutting tool: ${error}`);
    }
  }

  async count(): Promise<number> {
      const prisma = await getPrismaClient();
    try {
      return await prisma.cutting_tools.count();
    } catch (error) {
      throw new DatabaseError(`Failed to count cutting tools: ${error}`);
    }
  }

  async findByLocation(location: string): Promise<CuttingTool[]> {
      const prisma = await getPrismaClient();
    try {
      const tools = await prisma.cutting_tools.findMany({
        where: { location },
        orderBy: { name: 'asc' },
      });
      return tools.map(this.mapToCuttingTool);
    } catch (error) {
      throw new DatabaseError(`Failed to find cutting tools by location: ${error}`);
    }
  }

  async search(query: string): Promise<CuttingTool[]> {
      const prisma = await getPrismaClient();
    try {
      const tools = await prisma.cutting_tools.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { type: { contains: query } },
            { material: { contains: query } },
            { size: { contains: query } },
            { location: { contains: query } },
            { supplier: { contains: query } },
            { notes: { contains: query } },
          ],
        },
        orderBy: { name: 'asc' },
      });
      return tools.map(this.mapToCuttingTool);
    } catch (error) {
      throw new DatabaseError(`Failed to search cutting tools: ${error}`);
    }
  }

  async findLowInventory(): Promise<CuttingTool[]> {
      const prisma = await getPrismaClient();
    try {
      const tools = await prisma.cutting_tools.findMany({
        where: {
          quantity: { lte: 5 },
        },
        orderBy: [
          { quantity: 'asc' },
          { name: 'asc' },
        ],
      });
      return tools.map(this.mapToCuttingTool);
    } catch (error) {
      throw new DatabaseError(`Failed to find low inventory tools: ${error}`);
    }
  }

  async findByType(type: string): Promise<CuttingTool[]> {
      const prisma = await getPrismaClient();
    try {
      const tools = await prisma.cutting_tools.findMany({
        where: { type },
        orderBy: { name: 'asc' },
      });
      return tools.map(this.mapToCuttingTool);
    } catch (error) {
      throw new DatabaseError(`Failed to find cutting tools by type: ${error}`);
    }
  }

  async findEndOfLife(date?: string): Promise<CuttingTool[]> {
      const prisma = await getPrismaClient();
    try {
      const checkDate = date || new Date().toISOString().split('T')[0];
      const tools = await prisma.cutting_tools.findMany({
        where: {
          end_of_life_date: { lte: checkDate },
        },
        orderBy: { end_of_life_date: 'asc' },
      });
      return tools.map(this.mapToCuttingTool);
    } catch (error) {
      throw new DatabaseError(`Failed to find end of life tools: ${error}`);
    }
  }

  async updateQuantity(id: string, quantity: number): Promise<CuttingTool | null> {
      const prisma = await getPrismaClient();
    try {
      const updated = await prisma.cutting_tools.update({
        where: { id },
        data: { quantity },
      });
      return this.mapToCuttingTool(updated);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return null;
      }
      throw new DatabaseError(`Failed to update cutting tool quantity: ${error}`);
    }
  }

  private mapToCuttingTool(row: any): CuttingTool {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      material: row.material,
      size: row.size,
      quantity: row.quantity,
      minQuantity: row.min_quantity,
      location: row.location,
      toolLifeHours: row.tool_life_hours,
      remainingToolLifeHours: row.remaining_tool_life_hours,
      lastUsedDate: row.last_used_date,
      endOfLifeDate: row.end_of_life_date,
      supplier: row.supplier,
      costPerUnit: row.cost_per_unit,
      imageUrl: row.image_url,
      notes: row.notes,
    };
  }
}
