import { v4 as uuidv4 } from 'uuid';
import type { Consumable } from '@/lib/types';
import type { ConsumableRepository } from '../../interfaces';
import { DatabaseError, NotFoundError } from '../../interfaces';
import { getPrismaClient } from '../../prisma-client';

export class PrismaConsumableRepository implements ConsumableRepository {
  async findById(id: string): Promise<Consumable | null> {
    try {
      const prisma = await getPrismaClient();
      const tool = await prisma.consumables.findUnique({ 
        where: { id },
        include: {
          consumable_types: true,
          consumable_materials: true,
          locations: true,
        },
      });
      return tool ? this.mapToConsumable(tool) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find consumable by id: ${error}`);
    }
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<Consumable[]> {
    try {
      const prisma = await getPrismaClient();
      const tools = await prisma.consumables.findMany({
        skip: offset,
        take: limit,
        orderBy: { updated_at: 'desc' },
        include: {
          consumable_types: true,
          consumable_materials: true,
          locations: true,
        },
      });
      return tools.map(this.mapToConsumable);
    } catch (error) {
      throw new DatabaseError(`Failed to find all consumables: ${error}`);
    }
  }

  async create(item: Omit<Consumable, 'id'>): Promise<Consumable> {
    try {
      const prisma = await getPrismaClient();
      const created = await prisma.consumables.create({
        data: {
          id: uuidv4(),
          name: item.name,
          type_id: item.typeId,
          material_id: item.materialId ?? null,
          size: item.size ?? null,
          quantity: item.quantity,
          min_quantity: item.minQuantity,
          location_id: item.locationId,
          tool_life_hours: item.toolLifeHours ?? null,
          remaining_tool_life_hours: item.remainingToolLifeHours ?? null,
          last_used_date: item.lastUsedDate ?? null,
          end_of_life_date: item.endOfLifeDate ?? null,
          supplier: item.supplier ?? null,
          cost_per_unit: item.costPerUnit ?? null,
          image_url: item.imageUrl ?? null,
          notes: item.notes ?? null,
        },
        include: {
          consumable_types: true,
          consumable_materials: true,
          locations: true,
        },
      });
      return this.mapToConsumable(created);
    } catch (error: any) {
      throw new DatabaseError(`Failed to create Consumables: ${error.message}`);
    }
  }

  async update(id: string, item: Partial<Consumable>): Promise<Consumable | null> {
      const prisma = await getPrismaClient();
    try {
      const updated = await prisma.consumables.update({
        where: { id },
        data: {
          name: item.name,
          type_id: item.typeId,
          material_id: item.materialId,
          size: item.size,
          quantity: item.quantity,
          min_quantity: item.minQuantity,
          location_id: item.locationId,
          tool_life_hours: item.toolLifeHours,
          remaining_tool_life_hours: item.remainingToolLifeHours,
          last_used_date: item.lastUsedDate,
          end_of_life_date: item.endOfLifeDate,
          supplier: item.supplier,
          cost_per_unit: item.costPerUnit,
          image_url: item.imageUrl,
          notes: item.notes,
        },
        include: {
          consumable_types: true,
          consumable_materials: true,
          locations: true,
        },
      });
      return this.mapToConsumable(updated);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return null;
      }
      throw new DatabaseError(`Failed to update Consumables: ${error.message}`);
    }
  }

  async delete(id: string): Promise<boolean> {
      const prisma = await getPrismaClient();
    try {
      await prisma.consumables.delete({ where: { id } });
      return true;
    } catch (error: any) {
      if (error.code === 'P2025') {
        return false;
      }
      throw new DatabaseError(`Failed to delete Consumables: ${error}`);
    }
  }

  async count(): Promise<number> {
      const prisma = await getPrismaClient();
    try {
      return await prisma.consumables.count();
    } catch (error) {
      throw new DatabaseError(`Failed to count Consumables: ${error}`);
    }
  }

  async findByLocation(locationId: string): Promise<Consumable[]> {
      const prisma = await getPrismaClient();
    try {
      const tools = await prisma.consumables.findMany({
        where: { location_id: locationId },
        orderBy: { name: 'asc' },
        include: {
          consumable_types: true,
          consumable_materials: true,
          locations: true,
        },
      });
      return tools.map(this.mapToConsumable);
    } catch (error) {
      throw new DatabaseError(`Failed to find Consumables by location: ${error}`);
    }
  }

  async search(query: string): Promise<Consumable[]> {
      const prisma = await getPrismaClient();
    try {
      const tools = await prisma.consumables.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { consumable_types: { name: { contains: query } } },
            { consumable_materials: { name: { contains: query } } },
            { size: { contains: query } },
            { locations: { name: { contains: query } } },
            { supplier: { contains: query } },
            { notes: { contains: query } },
          ],
        },
        orderBy: { name: 'asc' },
        include: {
          consumable_types: true,
          consumable_materials: true,
          locations: true,
        },
      });
      return tools.map(this.mapToConsumable);
    } catch (error) {
      throw new DatabaseError(`Failed to search Consumables: ${error}`);
    }
  }

  async findLowInventory(): Promise<Consumable[]> {
      const prisma = await getPrismaClient();
    try {
      const tools = await prisma.consumables.findMany({
        where: {
          quantity: { lte: prisma.consumables.fields.min_quantity },
        },
        orderBy: [
          { quantity: 'asc' },
          { name: 'asc' },
        ],
        include: {
          consumable_types: true,
          consumable_materials: true,
          locations: true,
        },
      });
      return tools.map(this.mapToConsumable);
    } catch (error) {
      throw new DatabaseError(`Failed to find low inventory tools: ${error}`);
    }
  }

  async findByType(typeId: string): Promise<Consumable[]> {
      const prisma = await getPrismaClient();
    try {
      const tools = await prisma.consumables.findMany({
        where: { type_id: typeId },
        orderBy: { name: 'asc' },
        include: {
          consumable_types: true,
          consumable_materials: true,
          locations: true,
        },
      });
      return tools.map(this.mapToConsumable);
    } catch (error) {
      throw new DatabaseError(`Failed to find consumables by type: ${error}`);
    }
  }

  async findEndOfLife(date?: string): Promise<Consumable[]> {
      const prisma = await getPrismaClient();
    try {
      const checkDate = date || new Date().toISOString().split('T')[0];
      const tools = await prisma.consumables.findMany({
        where: {
          end_of_life_date: { lte: checkDate },
        },
        orderBy: { end_of_life_date: 'asc' },
      });
      return tools.map(this.mapToConsumable);
    } catch (error) {
      throw new DatabaseError(`Failed to find end of life tools: ${error}`);
    }
  }

  async updateQuantity(id: string, quantity: number): Promise<Consumable | null> {
      const prisma = await getPrismaClient();
    try {
      const updated = await prisma.consumables.update({
        where: { id },
        data: { quantity },
      });
      return this.mapToConsumable(updated);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return null;
      }
      throw new DatabaseError(`Failed to update Consumables quantity: ${error}`);
    }
  }

  private mapToConsumable(row: any): Consumable {
    return {
      id: row.id,
      name: row.name,
      typeId: row.type_id,
      type: row.consumable_types?.name,
      materialId: row.material_id,
      material: row.consumable_materials?.name,
      size: row.size,
      quantity: row.quantity,
      minQuantity: row.min_quantity,
      locationId: row.location_id,
      location: row.locations?.name,
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
