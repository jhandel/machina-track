/**
 * Maintenance Service
 * High-level service for maintenance task management operations
 */

import apiClient, { type MaintenanceTaskFilters } from './api-client';
import type { MaintenanceTask } from '@/lib/types';

export class MaintenanceService {
  /**
   * Get all maintenance tasks with optional filtering
   */
  async getAll(filters?: MaintenanceTaskFilters) {
    const response = await apiClient.getMaintenanceTasks(filters);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch maintenance tasks');
    }
    return response;
  }

  /**
   * Get maintenance task by ID
   */
  async getById(id: string) {
    const response = await apiClient.getMaintenanceTaskById(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch maintenance task');
    }
    return response.data as MaintenanceTask;
  }

  /**
   * Create new maintenance task
   */
  async create(task: Omit<MaintenanceTask, 'id'>) {
    const response = await apiClient.createMaintenanceTask(task);
    if (!response.success) {
      throw new Error(response.error || 'Failed to create maintenance task');
    }
    return response.data as MaintenanceTask;
  }

  /**
   * Update existing maintenance task
   */
  async update(id: string, task: Partial<MaintenanceTask>) {
    const response = await apiClient.updateMaintenanceTask(id, task);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update maintenance task');
    }
    return response.data as MaintenanceTask;
  }

  /**
   * Delete maintenance task
   */
  async delete(id: string) {
    const response = await apiClient.deleteMaintenanceTask(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete maintenance task');
    }
    return true;
  }

  /**
   * Get maintenance tasks by equipment ID
   */
  async getByEquipmentId(equipmentId: string) {
    return this.getAll({ equipmentId });
  }

  /**
   * Get maintenance tasks by status
   */
  async getByStatus(status: MaintenanceTask['status']) {
    return this.getAll({ status });
  }

  /**
   * Get maintenance tasks assigned to a person
   */
  async getByAssignee(assignedTo: string) {
    return this.getAll({ assignedTo });
  }

  /**
   * Get upcoming maintenance tasks (next N days)
   */
  async getUpcoming(days: number = 30) {
    return this.getAll({ upcoming: days });
  }

  /**
   * Get overdue maintenance tasks
   */
  async getOverdue() {
    return this.getAll({ overdue: true });
  }

  /**
   * Mark task as completed
   */
  async markCompleted(id: string, completedDate?: string) {
    return this.update(id, {
      status: 'completed',
      lastPerformedDate: completedDate || new Date().toISOString().split('T')[0]
    });
  }

  /**
   * Mark task as in progress
   */
  async markInProgress(id: string) {
    return this.update(id, { status: 'in_progress' });
  }

  /**
   * Skip task
   */
  async skip(id: string, notes?: string) {
    const updateData: Partial<MaintenanceTask> = { status: 'skipped' };
    if (notes) {
      updateData.notes = notes;
    }
    return this.update(id, updateData);
  }
}

// Export singleton instance
export const maintenanceService = new MaintenanceService();
