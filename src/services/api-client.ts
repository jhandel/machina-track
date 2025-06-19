/**
 * API Client for MachinaTrack
 * Handles all HTTP requests to the backend API
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface EquipmentFilters extends PaginationParams {
  status?: string;
  location?: string;
  search?: string;
}

export interface MaintenanceTaskFilters extends PaginationParams {
  status?: string;
  equipmentId?: string;
  assignedTo?: string;
  upcoming?: number;
  overdue?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  // Equipment API methods
  async getEquipment(filters: EquipmentFilters = {}) {
    const queryString = this.buildQueryString(filters);
    return this.request(`/equipment${queryString}`);
  }

  async getEquipmentById(id: string) {
    return this.request(`/equipment/${id}`);
  }

  async createEquipment(equipment: any) {
    return this.request('/equipment', {
      method: 'POST',
      body: JSON.stringify(equipment),
    });
  }

  async updateEquipment(id: string, equipment: any) {
    return this.request(`/equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(equipment),
    });
  }

  async deleteEquipment(id: string) {
    return this.request(`/equipment/${id}`, {
      method: 'DELETE',
    });
  }
  // Maintenance Tasks API methods
  async getMaintenanceTasks(filters: MaintenanceTaskFilters = {}) {
    const queryString = this.buildQueryString(filters);
    return this.request(`/maintenance-tasks${queryString}`);
  }

  async getMaintenanceTaskById(id: string) {
    return this.request(`/maintenance-tasks/${id}`);
  }

  async createMaintenanceTask(task: any) {
    return this.request('/maintenance-tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateMaintenanceTask(id: string, task: any) {
    return this.request(`/maintenance-tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    });
  }

  async deleteMaintenanceTask(id: string) {
    return this.request(`/maintenance-tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard API methods
  async getDashboard(activityLimit?: number) {
    const queryString = activityLimit ? `?activityLimit=${activityLimit}` : '';
    return this.request(`/dashboard${queryString}`);
  }

  // Health check
  async getHealth() {
    return this.request('/health');
  }

  // Service Records API methods
  async getServiceRecords(filters: {
    taskId?: string;
    performer?: string;
    startDate?: string;
    endDate?: string;
    equipmentId?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const queryString = this.buildQueryString(filters);
    return this.request(`/service-records${queryString}`);
  }

  async getServiceRecordById(id: string) {
    return this.request(`/service-records/${id}`);
  }

  async createServiceRecord(serviceRecord: any) {
    return this.request('/service-records', {
      method: 'POST',
      body: JSON.stringify(serviceRecord),
    });
  }

  async updateServiceRecord(id: string, serviceRecord: any) {
    return this.request(`/service-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(serviceRecord),
    });
  }

  async deleteServiceRecord(id: string) {
    return this.request(`/service-records/${id}`, {
      method: 'DELETE',
    });
  }

  // Machine Logs API methods
  async getMachineLogs(filters: {
    equipmentId?: string;
    errorCode?: string;
    metricName?: string;
    startDate?: string;
    endDate?: string;
    hours?: number;
    recent?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const queryString = this.buildQueryString(filters);
    return this.request(`/machine-logs${queryString}`);
  }

  async getMachineLogById(id: string) {
    return this.request(`/machine-logs/${id}`);
  }

  async createMachineLog(machineLog: any) {
    return this.request('/machine-logs', {
      method: 'POST',
      body: JSON.stringify(machineLog),
    });
  }

  async updateMachineLog(id: string, machineLog: any) {
    return this.request(`/machine-logs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(machineLog),
    });
  }

  async deleteMachineLog(id: string) {
    return this.request(`/machine-logs/${id}`, {
      method: 'DELETE',
    });
  }

  // Metrology Tools API methods
  async getMetrologyTools(filters: {
    status?: string;
    type?: string;
    location?: string;
    search?: string;
    due_calibration?: boolean;
    overdue_calibration?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const queryString = this.buildQueryString(filters);
    return this.request(`/metrology-tools${queryString}`);
  }

  async getMetrologyToolById(id: string) {
    return this.request(`/metrology-tools/${id}`);
  }

  async createMetrologyTool(tool: any) {
    return this.request('/metrology-tools', {
      method: 'POST',
      body: JSON.stringify(tool),
    });
  }

  async updateMetrologyTool(id: string, tool: any) {
    return this.request(`/metrology-tools/${id}`, {
      method: 'PUT', 
      body: JSON.stringify(tool),
    });
  }

  async deleteMetrologyTool(id: string) {
    return this.request(`/metrology-tools/${id}`, {
      method: 'DELETE',
    });
  }

  // Calibration Logs API methods
  async getCalibrationLogs(filters: {
    toolId?: string;
    performedBy?: string;
    result?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const queryString = this.buildQueryString(filters);
    return this.request(`/calibration-logs${queryString}`);
  }

  async getCalibrationLogById(id: string) {
    return this.request(`/calibration-logs/${id}`);
  }

  async createCalibrationLog(log: any) {
    return this.request('/calibration-logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  }

  async updateCalibrationLog(id: string, log: any) {
    return this.request(`/calibration-logs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(log),
    });
  }

  async deleteCalibrationLog(id: string) {
    return this.request(`/calibration-logs/${id}`, {
      method: 'DELETE',
    });
  }

  // Consumables API methods  
  async getConsumables(filters: {
    location?: string;
    type?: string;
    material?: string;
    low_inventory?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const queryString = this.buildQueryString(filters);
    return this.request(`/consumables${queryString}`);
  }

  async getConsumableById(id: string) {
    return this.request(`/consumables/${id}`);
  }

  async createConsumable(tool: any) {
    return this.request('/consumables', {
      method: 'POST',
      body: JSON.stringify(tool),
    });
  }

  async updateConsumable(id: string, tool: any) {
    return this.request(`/consumables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tool),
    });
  }

  async deleteConsumable(id: string) {
    return this.request(`/consumables/${id}`, {
      method: 'DELETE',
    });
  }

  // Settings API methods
  
  // Locations
  async getLocations() {
    return this.request('/settings/locations');
  }

  async createLocation(data: { name: string }) {
    return this.request('/settings/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLocation(id: string, data: { name: string }) {
    return this.request(`/settings/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLocation(id: string) {
    return this.request(`/settings/locations/${id}`, {
      method: 'DELETE',
    });
  }

  // Manufacturers
  async getManufacturers() {
    return this.request('/settings/manufacturers');
  }

  async createManufacturer(data: { name: string }) {
    return this.request('/settings/manufacturers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateManufacturer(id: string, data: { name: string }) {
    return this.request(`/settings/manufacturers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteManufacturer(id: string) {
    return this.request(`/settings/manufacturers/${id}`, {
      method: 'DELETE',
    });
  }

  // Metrology Tool Types
  async getMetrologyToolTypes() {
    return this.request('/settings/metrology-tool-types');
  }

  async createMetrologyToolType(data: { name: string }) {
    return this.request('/settings/metrology-tool-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMetrologyToolType(id: string, data: { name: string }) {
    return this.request(`/settings/metrology-tool-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMetrologyToolType(id: string) {
    return this.request(`/settings/metrology-tool-types/${id}`, {
      method: 'DELETE',
    });
  }

  // Consumable Materials
  async getConsumableMaterials() {
    return this.request('/settings/consumable-materials');
  }

  async createConsumableMaterial(data: { name: string }) {
    return this.request('/settings/consumable-materials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateConsumableMaterial(id: string, data: { name: string }) {
    return this.request(`/settings/consumable-materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteConsumableMaterial(id: string) {
    return this.request(`/settings/consumable-materials/${id}`, {
      method: 'DELETE',
    });
  }

  // Consumable Types
  async getConsumableTypes() {
    return this.request('/settings/consumable-types');
  }

  async createConsumableType(data: { name: string }) {
    return this.request('/settings/consumable-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateConsumableType(id: string, data: { name: string }) {
    return this.request(`/settings/consumable-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteConsumableType(id: string) {
    return this.request(`/settings/consumable-types/${id}`, {
      method: 'DELETE',
    });
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
