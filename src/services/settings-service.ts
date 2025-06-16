import apiClient from './api-client';
import type { Location, Manufacturer, MetrologyToolType, ConsumableMaterial, ConsumableType } from '@/lib/database/interfaces';

export interface CreateLocationRequest {
  name: string;
}

export interface CreateManufacturerRequest {
  name: string;
}

export interface CreateMetrologyToolTypeRequest {
  name: string;
}

export interface CreateConsumableMaterialRequest {
  name: string;
}

export interface CreateConsumableTypeRequest {
  name: string;
}

export class SettingsService {
  // Locations
  static async getLocations(): Promise<Location[]> {
    const response = await apiClient.getLocations();
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch locations');
    }
    return response.data as Location[];
  }

  static async createLocation(data: CreateLocationRequest): Promise<Location> {
    const response = await apiClient.createLocation(data);
    if (!response.success) {
      throw new Error(response.error || 'Failed to create location');
    }
    return response.data as Location;
  }

  static async updateLocation(id: string, data: CreateLocationRequest): Promise<Location> {
    const response = await apiClient.updateLocation(id, data);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update location');
    }
    return response.data as Location;
  }

  static async deleteLocation(id: string): Promise<void> {
    const response = await apiClient.deleteLocation(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete location');
    }
  }

  // Manufacturers
  static async getManufacturers(): Promise<Manufacturer[]> {
    const response = await apiClient.getManufacturers();
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch manufacturers');
    }
    return response.data as Manufacturer[];
  }

  static async createManufacturer(data: CreateManufacturerRequest): Promise<Manufacturer> {
    const response = await apiClient.createManufacturer(data);
    if (!response.success) {
      throw new Error(response.error || 'Failed to create manufacturer');
    }
    return response.data as Manufacturer;
  }

  static async updateManufacturer(id: string, data: CreateManufacturerRequest): Promise<Manufacturer> {
    const response = await apiClient.updateManufacturer(id, data);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update manufacturer');
    }
    return response.data as Manufacturer;
  }

  static async deleteManufacturer(id: string): Promise<void> {
    const response = await apiClient.deleteManufacturer(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete manufacturer');
    }
  }

  // Metrology Tool Types
  static async getMetrologyToolTypes(): Promise<MetrologyToolType[]> {
    const response = await apiClient.getMetrologyToolTypes();
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch metrology tool types');
    }
    return response.data as MetrologyToolType[];
  }

  static async createMetrologyToolType(data: CreateMetrologyToolTypeRequest): Promise<MetrologyToolType> {
    const response = await apiClient.createMetrologyToolType(data);
    if (!response.success) {
      throw new Error(response.error || 'Failed to create metrology tool type');
    }
    return response.data as MetrologyToolType;
  }

  static async updateMetrologyToolType(id: string, data: CreateMetrologyToolTypeRequest): Promise<MetrologyToolType> {
    const response = await apiClient.updateMetrologyToolType(id, data);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update metrology tool type');
    }
    return response.data as MetrologyToolType;
  }

  static async deleteMetrologyToolType(id: string): Promise<void> {
    const response = await apiClient.deleteMetrologyToolType(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete metrology tool type');
    }
  }

  // Consumable Materials
  static async getConsumableMaterials(): Promise<ConsumableMaterial[]> {
    const response = await apiClient.getConsumableMaterials();
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch consumable materials');
    }
    return response.data as ConsumableMaterial[];
  }

  static async createConsumableMaterial(data: CreateConsumableMaterialRequest): Promise<ConsumableMaterial> {
    const response = await apiClient.createConsumableMaterial(data);
    if (!response.success) {
      throw new Error(response.error || 'Failed to create consumable material');
    }
    return response.data as ConsumableMaterial;
  }

  static async updateConsumableMaterial(id: string, data: CreateConsumableMaterialRequest): Promise<ConsumableMaterial> {
    const response = await apiClient.updateConsumableMaterial(id, data);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update consumable material');
    }
    return response.data as ConsumableMaterial;
  }

  static async deleteConsumableMaterial(id: string): Promise<void> {
    const response = await apiClient.deleteConsumableMaterial(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete consumable material');
    }
  }

  // Consumable Types
  static async getConsumableTypes(): Promise<ConsumableType[]> {
    const response = await apiClient.getConsumableTypes();
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch consumable types');
    }
    return response.data as ConsumableType[];
  }

  static async createConsumableType(data: CreateConsumableTypeRequest): Promise<ConsumableType> {
    const response = await apiClient.createConsumableType(data);
    if (!response.success) {
      throw new Error(response.error || 'Failed to create consumable type');
    }
    return response.data as ConsumableType;
  }

  static async updateConsumableType(id: string, data: CreateConsumableTypeRequest): Promise<ConsumableType> {
    const response = await apiClient.updateConsumableType(id, data);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update consumable type');
    }
    return response.data as ConsumableType;
  }

  static async deleteConsumableType(id: string): Promise<void> {
    const response = await apiClient.deleteConsumableType(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete consumable type');
    }
  }
}
