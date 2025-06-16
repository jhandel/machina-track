import { getPrismaClient } from '@/lib/database/prisma-client';
import type { Location, Manufacturer, MetrologyToolType, ConsumableMaterial, ConsumableType, SettingsRepository } from '@/lib/database/interfaces';

export class PrismaSettingsRepository implements SettingsRepository {
  // Locations
  async getAllLocations(): Promise<Location[]> {
    const prisma = await getPrismaClient();
    const locations = await prisma.locations.findMany({
      orderBy: { name: 'asc' }
    });
    return locations.map(l => ({
      id: l.id,
      name: l.name,
      createdAt: l.created_at,
      updatedAt: l.updated_at
    }));
  }

  async createLocation(name: string): Promise<Location> {
    const prisma = await getPrismaClient();
    const location = await prisma.locations.create({
      data: {
        id: crypto.randomUUID(),
        name,
      },
    });
    return {
      id: location.id,
      name: location.name,
      createdAt: location.created_at,
      updatedAt: location.updated_at
    };
  }

  async updateLocation(id: string, name: string): Promise<Location> {
    const prisma = await getPrismaClient();
    const location = await prisma.locations.update({
      where: { id },
      data: { name, updated_at: new Date() },
    });
    return {
      id: location.id,
      name: location.name,
      createdAt: location.created_at,
      updatedAt: location.updated_at
    };
  }

  async deleteLocation(id: string): Promise<void> {
    const prisma = await getPrismaClient();
    await prisma.locations.delete({
      where: { id },
    });
  }

  // Manufacturers
  async getAllManufacturers(): Promise<Manufacturer[]> {
    const prisma = await getPrismaClient();
    const manufacturers = await prisma.manufacturers.findMany({
      orderBy: { name: 'asc' }
    });
    return manufacturers.map(m => ({
      id: m.id,
      name: m.name,
      createdAt: m.created_at,
      updatedAt: m.updated_at
    }));
  }

  async createManufacturer(name: string): Promise<Manufacturer> {
    const prisma = await getPrismaClient();
    const manufacturer = await prisma.manufacturers.create({
      data: {
        id: crypto.randomUUID(),
        name,
      },
    });
    return {
      id: manufacturer.id,
      name: manufacturer.name,
      createdAt: manufacturer.created_at,
      updatedAt: manufacturer.updated_at
    };
  }

  async updateManufacturer(id: string, name: string): Promise<Manufacturer> {
    const prisma = await getPrismaClient();
    const manufacturer = await prisma.manufacturers.update({
      where: { id },
      data: { name, updated_at: new Date() },
    });
    return {
      id: manufacturer.id,
      name: manufacturer.name,
      createdAt: manufacturer.created_at,
      updatedAt: manufacturer.updated_at
    };
  }

  async deleteManufacturer(id: string): Promise<void> {
    const prisma = await getPrismaClient();
    await prisma.manufacturers.delete({
      where: { id },
    });
  }

  // Metrology Tool Types
  async getAllMetrologyToolTypes(): Promise<MetrologyToolType[]> {
    const prisma = await getPrismaClient();
    const types = await prisma.metrology_tool_types.findMany({
      orderBy: { name: 'asc' }
    });
    return types.map(t => ({
      id: t.id,
      name: t.name,
      createdAt: t.created_at,
      updatedAt: t.updated_at
    }));
  }

  async createMetrologyToolType(name: string): Promise<MetrologyToolType> {
    const prisma = await getPrismaClient();
    const type = await prisma.metrology_tool_types.create({
      data: {
        id: crypto.randomUUID(),
        name,
      },
    });
    return {
      id: type.id,
      name: type.name,
      createdAt: type.created_at,
      updatedAt: type.updated_at
    };
  }

  async updateMetrologyToolType(id: string, name: string): Promise<MetrologyToolType> {
    const prisma = await getPrismaClient();
    const type = await prisma.metrology_tool_types.update({
      where: { id },
      data: { name, updated_at: new Date() },
    });
    return {
      id: type.id,
      name: type.name,
      createdAt: type.created_at,
      updatedAt: type.updated_at
    };
  }

  async deleteMetrologyToolType(id: string): Promise<void> {
    const prisma = await getPrismaClient();
    await prisma.metrology_tool_types.delete({
      where: { id },
    });
  }

  // Consumable Materials
  async getAllConsumableMaterials(): Promise<ConsumableMaterial[]> {
    const prisma = await getPrismaClient();
    const materials = await prisma.consumable_materials.findMany({
      orderBy: { name: 'asc' }
    });
    return materials.map(m => ({
      id: m.id,
      name: m.name,
      createdAt: m.created_at,
      updatedAt: m.updated_at
    }));
  }

  async createConsumableMaterial(name: string): Promise<ConsumableMaterial> {
    const prisma = await getPrismaClient();
    const material = await prisma.consumable_materials.create({
      data: {
        id: crypto.randomUUID(),
        name,
      },
    });
    return {
      id: material.id,
      name: material.name,
      createdAt: material.created_at,
      updatedAt: material.updated_at
    };
  }

  async updateConsumableMaterial(id: string, name: string): Promise<ConsumableMaterial> {
    const prisma = await getPrismaClient();
    const material = await prisma.consumable_materials.update({
      where: { id },
      data: { name, updated_at: new Date() },
    });
    return {
      id: material.id,
      name: material.name,
      createdAt: material.created_at,
      updatedAt: material.updated_at
    };
  }

  async deleteConsumableMaterial(id: string): Promise<void> {
    const prisma = await getPrismaClient();
    await prisma.consumable_materials.delete({
      where: { id },
    });
  }

  // Consumable Types
  async getAllConsumableTypes(): Promise<ConsumableType[]> {
    const prisma = await getPrismaClient();
    const types = await prisma.consumable_types.findMany({
      orderBy: { name: 'asc' }
    });
    return types.map(t => ({
      id: t.id,
      name: t.name,
      createdAt: t.created_at,
      updatedAt: t.updated_at
    }));
  }

  async createConsumableType(name: string): Promise<ConsumableType> {
    const prisma = await getPrismaClient();
    const type = await prisma.consumable_types.create({
      data: {
        id: crypto.randomUUID(),
        name,
      },
    });
    return {
      id: type.id,
      name: type.name,
      createdAt: type.created_at,
      updatedAt: type.updated_at
    };
  }

  async updateConsumableType(id: string, name: string): Promise<ConsumableType> {
    const prisma = await getPrismaClient();
    const type = await prisma.consumable_types.update({
      where: { id },
      data: { name, updated_at: new Date() },
    });
    return {
      id: type.id,
      name: type.name,
      createdAt: type.created_at,
      updatedAt: type.updated_at
    };
  }

  async deleteConsumableType(id: string): Promise<void> {
    const prisma = await getPrismaClient();
    await prisma.consumable_types.delete({
      where: { id },
    });
  }
}
