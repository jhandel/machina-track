import { v4 as uuidv4 } from 'uuid';
import type { Equipment } from '@/lib/types';
import type { EquipmentRepository } from '../../interfaces';
import { DatabaseError, NotFoundError, DuplicateError } from '../../interfaces';
import { getPrismaClient } from '../../prisma-client';

export class PrismaEquipmentRepository implements EquipmentRepository {
  async findById(id: string): Promise<Equipment | null> {
      const prisma = await getPrismaClient();
    try {
      const prisma = await getPrismaClient();
      const equipment = await prisma.equipment.findUnique({ where: { id } });
      return equipment ? this.mapToEquipment(equipment) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find equipment by id: ${error}`);
    }
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<Equipment[]> {
      const prisma = await getPrismaClient();
    try {
      const prisma = await getPrismaClient();
      const equipmentList = await prisma.equipment.findMany({
        skip: offset,
        take: limit,
        orderBy: { updated_at: 'desc' },
      });
      return equipmentList.map(this.mapToEquipment);
    } catch (error) {
      throw new DatabaseError(`Failed to find all equipment: ${error}`);
    }
  }

  async create(item: Omit<Equipment, 'id'>): Promise<Equipment> {
      const prisma = await getPrismaClient();
    try {
      const prisma = await getPrismaClient();
      const created = await prisma.equipment.create({
        data: {
          id: uuidv4(),
          name: item.name,
          model: item.model,
          serial_number: item.serialNumber,
          location: item.location,
          purchase_date: item.purchaseDate ?? null,
          status: item.status,
          image_url: item.imageUrl ?? null,
          notes: item.notes ?? null,
        },
      });
      return this.mapToEquipment(created);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new DuplicateError('Equipment', 'serial number');
      }
      throw new DatabaseError(`Failed to create equipment: ${error.message}`);
    }
  }

  async update(id: string, item: Partial<Equipment>): Promise<Equipment | null> {
      const prisma = await getPrismaClient();
    try {
      const prisma = await getPrismaClient();
      const updated = await prisma.equipment.update({
        where: { id },
        data: {
          name: item.name,
          model: item.model,
          serial_number: item.serialNumber,
          location: item.location,
          purchase_date: item.purchaseDate,
          status: item.status,
          image_url: item.imageUrl,
          notes: item.notes,
        },
      });
      return this.mapToEquipment(updated);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return null;
      }
      if (error.code === 'P2002') {
        throw new DuplicateError('Equipment', 'serial number');
      }
      throw new DatabaseError(`Failed to update equipment: ${error.message}`);
    }
  }

  async delete(id: string): Promise<boolean> {
      const prisma = await getPrismaClient();
    try {
      const prisma = await getPrismaClient();
      await prisma.equipment.delete({ where: { id } });
      return true;
    } catch (error: any) {
      if (error.code === 'P2025') {
        return false;
      }
      throw new DatabaseError(`Failed to delete equipment: ${error}`);
    }
  }

  async count(): Promise<number> {
      const prisma = await getPrismaClient();
    try {
      const prisma = await getPrismaClient();
      return await prisma.equipment.count();
    } catch (error) {
      throw new DatabaseError(`Failed to count equipment: ${error}`);
    }
  }

  async findByStatus(status: Equipment['status']): Promise<Equipment[]> {
      const prisma = await getPrismaClient();
    try {
      const prisma = await getPrismaClient();
      const equipmentList = await prisma.equipment.findMany({
        where: { status },
        orderBy: { updated_at: 'desc' },
      });
      return equipmentList.map(this.mapToEquipment);
    } catch (error) {
      throw new DatabaseError(`Failed to find equipment by status: ${error}`);
    }
  }

  async findByLocation(location: string): Promise<Equipment[]> {
      const prisma = await getPrismaClient();
    try {
      const prisma = await getPrismaClient();
      const equipmentList = await prisma.equipment.findMany({
        where: { location },
        orderBy: { name: 'asc' },
      });
      return equipmentList.map(this.mapToEquipment);
    } catch (error) {
      throw new DatabaseError(`Failed to find equipment by location: ${error}`);
    }
  }

  async findBySerialNumber(serialNumber: string): Promise<Equipment | null> {
      const prisma = await getPrismaClient();
    try {
      const prisma = await getPrismaClient();
      const equipment = await prisma.equipment.findUnique({ where: { serial_number: serialNumber } });
      return equipment ? this.mapToEquipment(equipment) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find equipment by serial number: ${error}`);
    }
  }

  async search(query: string): Promise<Equipment[]> {
      const prisma = await getPrismaClient();
    try {
      const prisma = await getPrismaClient();
      const equipmentList = await prisma.equipment.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { model: { contains: query } },
            { serial_number: { contains: query } },
            { location: { contains: query } },
          ],
        },
        orderBy: { name: 'asc' },
      });
      return equipmentList.map(this.mapToEquipment);
    } catch (error) {
      throw new DatabaseError(`Failed to search equipment: ${error}`);
    }
  }

  private mapToEquipment(row: any): Equipment {
    return {
      id: row.id,
      name: row.name,
      model: row.model,
      serialNumber: row.serial_number,
      location: row.location,
      purchaseDate: row.purchase_date,
      status: row.status,
      imageUrl: row.image_url,
      notes: row.notes,
      maintenanceScheduleIds: [],
    };
  }
}
