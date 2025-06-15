import apiClient from './api-client';
import type { MachineLogEntry } from '@/lib/types';

export class MachineLogService {
  async getAll(params?: {
    equipmentId?: string;
    errorCode?: string;
    metricName?: string;
    startDate?: string;
    endDate?: string;
    hours?: number;
    recent?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<MachineLogEntry[]> {
    const response = await apiClient.getMachineLogs(params || {});
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch machine logs');
    }
    return response.data as MachineLogEntry[];
  }

  async getById(id: string): Promise<MachineLogEntry> {
    const response = await apiClient.getMachineLogById(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch machine log');
    }
    return response.data as MachineLogEntry;
  }

  async create(machineLog: Omit<MachineLogEntry, 'id'>): Promise<MachineLogEntry> {
    const response = await apiClient.createMachineLog(machineLog);
    if (!response.success) {
      throw new Error(response.error || 'Failed to create machine log');
    }
    return response.data as MachineLogEntry;
  }

  async update(id: string, updates: Partial<MachineLogEntry>): Promise<MachineLogEntry> {
    const response = await apiClient.updateMachineLog(id, updates);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update machine log');
    }
    return response.data as MachineLogEntry;
  }

  async delete(id: string): Promise<void> {
    const response = await apiClient.deleteMachineLog(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete machine log');
    }
  }

  async getByEquipmentId(equipmentId: string, limit?: number): Promise<MachineLogEntry[]> {
    return this.getAll({ equipmentId, limit });
  }

  async getByDateRange(equipmentId: string, startDate: string, endDate: string): Promise<MachineLogEntry[]> {
    return this.getAll({ equipmentId, startDate, endDate });
  }

  async getByErrorCode(errorCode: string): Promise<MachineLogEntry[]> {
    return this.getAll({ errorCode });
  }

  async getByMetric(metricName: string): Promise<MachineLogEntry[]> {
    return this.getAll({ metricName });
  }

  async getRecentLogs(equipmentId: string, hours: number = 24): Promise<MachineLogEntry[]> {
    return this.getAll({ equipmentId, hours, recent: true });
  }
}
