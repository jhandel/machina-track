/**
 * Metrology Service
 * High-level service for metrology tool management operations
 */

import apiClient from './api-client';
import type { MetrologyTool, CalibrationLog } from '@/lib/types';

export class MetrologyService {
  /**
   * Get all metrology tools with optional filtering
   */
  async getAll(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    type?: string;
    location?: string;
    search?: string;
    due_calibration?: boolean;
    overdue_calibration?: boolean;
  }): Promise<MetrologyTool[]> {
    const response = await apiClient.getMetrologyTools(params);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch metrology tools');
    }
    return response.data as MetrologyTool[];
  }

  /**
   * Get a specific metrology tool by ID
   */
  async getById(id: string): Promise<MetrologyTool | null> {
    try {
      const response = await apiClient.getMetrologyToolById(id);
      if (!response.success || !response.data) {
        return null;
      }
      return response.data as MetrologyTool;
    } catch (error) {
      console.error('Error fetching metrology tool:', error);
      return null;
    }
  }

  /**
   * Create a new metrology tool
   */
  async create(data: Omit<MetrologyTool, 'id' | 'createdAt' | 'updatedAt'>): Promise<MetrologyTool> {
    const response = await apiClient.createMetrologyTool(data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create metrology tool');
    }
    return response.data as MetrologyTool;
  }

  /**
   * Update an existing metrology tool
   */
  async update(id: string, data: Partial<MetrologyTool>): Promise<MetrologyTool> {
    const response = await apiClient.updateMetrologyTool(id, data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update metrology tool');
    }
    return response.data as MetrologyTool;
  }

  /**
   * Delete a metrology tool
   */
  async delete(id: string): Promise<void> {
    const response = await apiClient.deleteMetrologyTool(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete metrology tool');
    }
  }

  /**
   * Get metrology tools by status
   */
  async getByStatus(status: string, limit?: number): Promise<MetrologyTool[]> {
    return this.getAll({ status, limit });
  }

  /**
   * Get tools due for calibration
   */
  async getDueCalibration(days?: number): Promise<MetrologyTool[]> {
    return this.getAll({ due_calibration: true });
  }

  /**
   * Get overdue calibration tools
   */
  async getOverdueCalibration(): Promise<MetrologyTool[]> {
    return this.getAll({ overdue_calibration: true });
  }

  /**
   * Search metrology tools
   */
  async search(query: string, limit?: number): Promise<MetrologyTool[]> {
    return this.getAll({ search: query, limit });
  }

  /**
   * Get calibration logs for a specific tool
   */
  async getCalibrationLogs(toolId: string): Promise<CalibrationLog[]> {
    const response = await apiClient.getCalibrationLogs({ metrology_tool_id: toolId });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch calibration logs');
    }
    return response.data as CalibrationLog[];
  }

  /**
   * Get all calibration logs with optional filtering
   */
  async getAllCalibrationLogs(params?: {
    limit?: number;
    offset?: number;
    metrology_tool_id?: string;
    performed_by?: string;
    result?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<CalibrationLog[]> {
    const response = await apiClient.getCalibrationLogs(params);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch calibration logs');
    }
    return response.data as CalibrationLog[];
  }

  /**
   * Create a new calibration log
   */
  async createCalibrationLog(data: Omit<CalibrationLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalibrationLog> {
    const response = await apiClient.createCalibrationLog(data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create calibration log');
    }
    return response.data as CalibrationLog;
  }

  /**
   * Update an existing calibration log
   */
  async updateCalibrationLog(id: string, data: Partial<CalibrationLog>): Promise<CalibrationLog> {
    const response = await apiClient.updateCalibrationLog(id, data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update calibration log');
    }
    return response.data as CalibrationLog;
  }

  /**
   * Delete a calibration log
   */
  async deleteCalibrationLog(id: string): Promise<void> {
    const response = await apiClient.deleteCalibrationLog(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete calibration log');
    }
  }

  /**
   * Get calibration statistics
   */
  async getCalibrationStats(): Promise<{
    total: number;
    dueCalibration: number;
    overdueCalibration: number;
    calibratedCount: number;
    recentCalibrations: CalibrationLog[];
  }> {
    const [
      allTools,
      dueTools,
      overdueTools,
      recentCalibrations
    ] = await Promise.all([
      this.getAll(),
      this.getDueCalibration(),
      this.getOverdueCalibration(),
      this.getAllCalibrationLogs({ limit: 10 })
    ]);

    const calibratedCount = allTools.filter(tool => tool.status === 'calibrated').length;

    return {
      total: allTools.length,
      dueCalibration: dueTools.length,
      overdueCalibration: overdueTools.length,
      calibratedCount,
      recentCalibrations
    };
  }
}

// Export singleton instance
export const metrologyService = new MetrologyService();
