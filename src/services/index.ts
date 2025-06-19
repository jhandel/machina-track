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

// Consumable Service
export { ConsumableService, consumableService } from './consumable-service';

// Service Record Service
export { ServiceRecordService } from './service-record-service';

// Machine Log Service  
export { MachineLogService } from './machine-log-service';

// Paperless Service
export { PaperlessService, paperlessService } from './paperless-service';

// Re-export types from lib for convenience
export type { 
  Equipment, 
  MetrologyTool, 
  CalibrationLog, 
  Consumable, 
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
  CreateConsumableMaterialRequest,
  CreateConsumableTypeRequest
} from './settings-service';
