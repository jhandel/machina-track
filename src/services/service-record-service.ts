import apiClient from './api-client';
import type { ServiceRecord } from '@/lib/types';

export class ServiceRecordService {
  async getAll(params?: {
    taskId?: string;
    performer?: string;
    startDate?: string;
    endDate?: string;
    equipmentId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ServiceRecord[]> {
    const response = await apiClient.getServiceRecords(params || {});
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch service records');
    }
    return response.data as ServiceRecord[];
  }

  async getById(id: string): Promise<ServiceRecord> {
    const response = await apiClient.getServiceRecordById(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch service record');
    }
    return response.data as ServiceRecord;
  }

  async create(serviceRecord: Omit<ServiceRecord, 'id'>): Promise<ServiceRecord> {
    const response = await apiClient.createServiceRecord(serviceRecord);
    if (!response.success) {
      throw new Error(response.error || 'Failed to create service record');
    }
    return response.data as ServiceRecord;
  }

  async update(id: string, updates: Partial<ServiceRecord>): Promise<ServiceRecord> {
    const response = await apiClient.updateServiceRecord(id, updates);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update service record');
    }
    return response.data as ServiceRecord;
  }

  async delete(id: string): Promise<void> {
    const response = await apiClient.deleteServiceRecord(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete service record');
    }
  }

  async getByTaskId(taskId: string): Promise<ServiceRecord[]> {
    return this.getAll({ taskId });
  }

  async getByPerformer(performer: string): Promise<ServiceRecord[]> {
    return this.getAll({ performer });
  }

  async getByDateRange(startDate: string, endDate: string): Promise<ServiceRecord[]> {
    return this.getAll({ startDate, endDate });
  }

  async getByEquipmentId(equipmentId: string): Promise<ServiceRecord[]> {
    return this.getAll({ equipmentId });
  }
}

// Export singleton instance
export const serviceRecordService = new ServiceRecordService();
