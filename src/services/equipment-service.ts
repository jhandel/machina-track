/**
 * Equipment Service
 * High-level service for equipment management operations
 */

import apiClient, { type EquipmentFilters } from './api-client';
import type { Equipment } from '@/lib/types';

export class EquipmentService {
  /**
   * Get all equipment with optional filtering
   */
  async getAll(filters?: EquipmentFilters) {
    const response = await apiClient.getEquipment(filters);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch equipment');
    }
    return response;
  }

  /**
   * Get equipment by ID
   */
  async getById(id: string) {
    const response = await apiClient.getEquipmentById(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch equipment');
    }
    return response.data as Equipment;
  }

  /**
   * Create new equipment
   */
  async create(equipment: Omit<Equipment, 'id'>) {
    const response = await apiClient.createEquipment(equipment);
    if (!response.success) {
      throw new Error(response.error || 'Failed to create equipment');
    }
    return response.data as Equipment;
  }

  /**
   * Update existing equipment
   */
  async update(id: string, equipment: Partial<Equipment>) {
    const response = await apiClient.updateEquipment(id, equipment);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update equipment');
    }
    return response.data as Equipment;
  }

  /**
   * Delete equipment
   */
  async delete(id: string) {
    const response = await apiClient.deleteEquipment(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete equipment');
    }
    return true;
  }

  /**
   * Search equipment
   */
  async search(query: string) {
    return this.getAll({ search: query });
  }

  /**
   * Get equipment by status
   */
  async getByStatus(status: Equipment['status']) {
    return this.getAll({ status });
  }

  /**
   * Get equipment by location
   */
  async getByLocation(location: string) {
    return this.getAll({ location });
  }
}

// Export singleton instance
export const equipmentService = new EquipmentService();
