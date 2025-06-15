/**
 * Service Index
 * Exports all service modules for easy import
 */

// API Client
export { default as apiClient } from './api-client';
export type { ApiResponse, PaginationParams, EquipmentFilters, MaintenanceTaskFilters } from './api-client';

// Equipment Service
export { EquipmentService, equipmentService } from './equipment-service';

// Maintenance Service
export { MaintenanceService, maintenanceService } from './maintenance-service';

// Dashboard Service
export { DashboardService, dashboardService } from './dashboard-service';
export type { DashboardData } from './dashboard-service';

// Metrology Service
export { MetrologyService, metrologyService } from './metrology-service';

// Cutting Tool Service
export { CuttingToolService, cuttingToolService } from './cutting-tool-service';

// Service Record Service
export { ServiceRecordService } from './service-record-service';

// Machine Log Service  
export { MachineLogService } from './machine-log-service';

// Re-export types from lib for convenience
export type { 
  Equipment, 
  MetrologyTool, 
  CalibrationLog, 
  CuttingTool, 
  MaintenanceTask, 
  ServiceRecord,
  MachineLogEntry,
  DashboardSummary 
} from '@/lib/types';

// Settings Service
export { SettingsService } from './settings-service';
export type {
  CreateLocationRequest,
  CreateManufacturerRequest,
  CreateMetrologyToolTypeRequest,
  CreateCuttingToolMaterialRequest
} from './settings-service';
