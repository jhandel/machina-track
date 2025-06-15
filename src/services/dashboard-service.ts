/**
 * Dashboard Service
 * High-level service for dashboard data and analytics
 */

import apiClient from './api-client';
import type { DashboardSummary } from '@/lib/types';

export interface DashboardData {
  summary: DashboardSummary;
  recentActivity: any[];
  equipmentStatusCounts: Record<string, number>;
  maintenanceStatusCounts: Record<string, number>;
}

export class DashboardService {
  /**
   * Get complete dashboard data
   */
  async getDashboardData(activityLimit?: number): Promise<DashboardData> {
    const response = await apiClient.getDashboard(activityLimit);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch dashboard data');
    }
    return response.data as DashboardData;
  }

  /**
   * Get dashboard summary only
   */
  async getSummary(): Promise<DashboardSummary> {
    const data = await this.getDashboardData();
    return data.summary;
  }

  /**
   * Get recent activity only
   */
  async getRecentActivity(limit?: number): Promise<any[]> {
    const data = await this.getDashboardData(limit);
    return data.recentActivity;
  }

  /**
   * Get equipment status distribution
   */
  async getEquipmentStatusCounts(): Promise<Record<string, number>> {
    const data = await this.getDashboardData();
    return data.equipmentStatusCounts;
  }

  /**
   * Get maintenance status distribution
   */
  async getMaintenanceStatusCounts(): Promise<Record<string, number>> {
    const data = await this.getDashboardData();
    return data.maintenanceStatusCounts;
  }

  /**
   * Get health status of the system
   */
  async getHealthStatus() {
    const response = await apiClient.getHealth();
    if (!response.success) {
      throw new Error(response.error || 'Health check failed');
    }
    return response.data;
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
