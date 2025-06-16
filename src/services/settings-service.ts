import apiClient from './api-client';
import type { Location, Manufacturer, MetrologyToolType, CuttingToolMaterial, CuttingToolType } from '@/lib/database/interfaces';

export interface CreateLocationRequest {
  name: string;
}

export interface CreateManufacturerRequest {
  name: string;
}

export interface CreateMetrologyToolTypeRequest {
  name: string;
}

export interface CreateCuttingToolMaterialRequest {
  name: string;
}

export interface CreateCuttingToolTypeRequest {
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

  // Cutting Tool Materials
  static async getCuttingToolMaterials(): Promise<CuttingToolMaterial[]> {
    const response = await apiClient.getCuttingToolMaterials();
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch cutting tool materials');
    }
    return response.data as CuttingToolMaterial[];
  }

  static async createCuttingToolMaterial(data: CreateCuttingToolMaterialRequest): Promise<CuttingToolMaterial> {
    const response = await apiClient.createCuttingToolMaterial(data);
    if (!response.success) {
      throw new Error(response.error || 'Failed to create cutting tool material');
    }
    return response.data as CuttingToolMaterial;
  }

  static async updateCuttingToolMaterial(id: string, data: CreateCuttingToolMaterialRequest): Promise<CuttingToolMaterial> {
    const response = await apiClient.updateCuttingToolMaterial(id, data);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update cutting tool material');
    }
    return response.data as CuttingToolMaterial;
  }

  static async deleteCuttingToolMaterial(id: string): Promise<void> {
    const response = await apiClient.deleteCuttingToolMaterial(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete cutting tool material');
    }
  }

  // Cutting Tool Types
  static async getCuttingToolTypes(): Promise<CuttingToolType[]> {
    const response = await apiClient.getCuttingToolTypes();
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch cutting tool types');
    }
    return response.data as CuttingToolType[];
  }

  static async createCuttingToolType(data: CreateCuttingToolTypeRequest): Promise<CuttingToolType> {
    const response = await apiClient.createCuttingToolType(data);
    if (!response.success) {
      throw new Error(response.error || 'Failed to create cutting tool type');
    }
    return response.data as CuttingToolType;
  }

  static async updateCuttingToolType(id: string, data: CreateCuttingToolTypeRequest): Promise<CuttingToolType> {
    const response = await apiClient.updateCuttingToolType(id, data);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update cutting tool type');
    }
    return response.data as CuttingToolType;
  }

  static async deleteCuttingToolType(id: string): Promise<void> {
    const response = await apiClient.deleteCuttingToolType(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete cutting tool type');
    }
  }
}
