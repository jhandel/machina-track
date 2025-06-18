/**
 * Maintenance Service
 * High-level service for maintenance task management operations
 */

import apiClient, { type MaintenanceTaskFilters } from './api-client';
import type { MaintenanceTask, ServiceRecord } from '@/lib/types';
import { serviceRecordService } from './service-record-service';

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
   * Complete a maintenance task with the following workflow:
   * 1. Create a service log to record the maintenance
   * 2. If the task has a frequency, set the next due date & reset to pending
   * 3. If the task has no frequency, mark it complete and null out the next due date
   */
  async completeMaintenanceTask(
    id: string, 
    serviceRecordData: {
      performedBy: string;
      descriptionOfWork: string;
      cost?: number;
      notes?: string;
      attachments?: string[];
    }
  ): Promise<{ task: MaintenanceTask; serviceRecord: ServiceRecord }> {
    // Get current task details
    const task = await this.getById(id);
    
    // 1. Create service record for the completed maintenance
    const serviceRecord = await serviceRecordService.create({
      maintenanceTaskId: id,
      date: new Date().toISOString().split('T')[0],
      performedBy: serviceRecordData.performedBy,
      descriptionOfWork: serviceRecordData.descriptionOfWork,
      cost: serviceRecordData.cost,
      notes: serviceRecordData.notes,
      attachments: serviceRecordData.attachments
    });
    
    // 2 & 3. Update the maintenance task
    const today = new Date().toISOString().split('T')[0];
    const updateData: Partial<MaintenanceTask> = {
      lastPerformedDate: today,
    };
    
    if (task.frequencyDays && task.frequencyDays > 0) {
      // Task has frequency - calculate next due date and set status back to pending
      const nextDueDate = new Date();
      nextDueDate.setDate(nextDueDate.getDate() + task.frequencyDays);
      
      updateData.nextDueDate = nextDueDate.toISOString().split('T')[0];
      updateData.status = 'pending';
    } else {
      // One-time task - mark as completed and null out next due date
      updateData.nextDueDate = undefined;
      updateData.status = 'completed';
    }
    
    // Add service record ID to the task's list of service records
    updateData.serviceRecordIds = [
      ...(task.serviceRecordIds || []),
      serviceRecord.id
    ];
    
    // Update the task
    const updatedTask = await this.update(id, updateData);
    
    return {
      task: updatedTask,
      serviceRecord
    };
  }

  /**
   * Mark task as completed
   * @deprecated Use completeMaintenanceTask instead to create a service record
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
