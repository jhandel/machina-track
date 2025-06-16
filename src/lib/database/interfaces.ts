import type { 
  Equipment, 
  MetrologyTool, 
  CalibrationLog, 
  Consumable, 
  MaintenanceTask, 
  ServiceRecord,
  MachineLogEntry,
  DashboardSummary
} from '@/lib/types';

/**
 * Generic repository interface for common CRUD operations
 */
export interface BaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(limit?: number, offset?: number): Promise<T[]>;
  create(item: Omit<T, 'id'>): Promise<T>;
  update(id: string, item: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
}

/**
 * Equipment repository interface
 */
export interface EquipmentRepository extends BaseRepository<Equipment> {
  findByStatus(status: Equipment['status']): Promise<Equipment[]>;
  findByLocation(location: string): Promise<Equipment[]>;
  findBySerialNumber(serialNumber: string): Promise<Equipment | null>;
  search(query: string): Promise<Equipment[]>;
}

/**
 * Metrology tool repository interface
 */
export interface MetrologyToolRepository extends BaseRepository<MetrologyTool> {
  findByStatus(status: MetrologyTool['status']): Promise<MetrologyTool[]>;
  findDueForCalibration(date?: string): Promise<MetrologyTool[]>;
  findOverdueCalibration(date?: string): Promise<MetrologyTool[]>;
  findBySerialNumber(serialNumber: string): Promise<MetrologyTool | null>;
  search(query: string): Promise<MetrologyTool[]>;
}

/**
 * Calibration log repository interface
 */
export interface CalibrationLogRepository extends BaseRepository<CalibrationLog> {
  findByToolId(toolId: string): Promise<CalibrationLog[]>;
  findByDateRange(startDate: string, endDate: string): Promise<CalibrationLog[]>;
  findByPerformer(performedBy: string): Promise<CalibrationLog[]>;
}

/**
 * Consumable repository interface
 */
export interface ConsumableRepository extends BaseRepository<Consumable> {
  findLowInventory(): Promise<Consumable[]>;
  findByLocation(location: string): Promise<Consumable[]>;
  findByType(type: string): Promise<Consumable[]>;
  findEndOfLife(date?: string): Promise<Consumable[]>;
  search(query: string): Promise<Consumable[]>;
  updateQuantity(id: string, quantity: number): Promise<Consumable | null>;
}

/**
 * Generic repository interface for common CRUD operations
 */
export interface BaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(limit?: number, offset?: number): Promise<T[]>;
  create(item: Omit<T, 'id'>): Promise<T>;
  update(id: string, item: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
}

/**
 * Equipment repository interface
 */
export interface EquipmentRepository extends BaseRepository<Equipment> {
  findByStatus(status: Equipment['status']): Promise<Equipment[]>;
  findByLocation(location: string): Promise<Equipment[]>;
  findBySerialNumber(serialNumber: string): Promise<Equipment | null>;
  search(query: string): Promise<Equipment[]>;
}

/**
 * Metrology tool repository interface
 */
export interface MetrologyToolRepository extends BaseRepository<MetrologyTool> {
  findByStatus(status: MetrologyTool['status']): Promise<MetrologyTool[]>;
  findDueForCalibration(date?: string): Promise<MetrologyTool[]>;
  findOverdueCalibration(date?: string): Promise<MetrologyTool[]>;
  findBySerialNumber(serialNumber: string): Promise<MetrologyTool | null>;
  search(query: string): Promise<MetrologyTool[]>;
}

/**
 * Calibration log repository interface
 */
export interface CalibrationLogRepository extends BaseRepository<CalibrationLog> {
  findByToolId(toolId: string): Promise<CalibrationLog[]>;
  findByDateRange(startDate: string, endDate: string): Promise<CalibrationLog[]>;
  findByPerformer(performedBy: string): Promise<CalibrationLog[]>;
}

/**
 * Maintenance task repository interface
 */
export interface MaintenanceTaskRepository extends BaseRepository<MaintenanceTask> {
  findByEquipmentId(equipmentId: string): Promise<MaintenanceTask[]>;
  findByStatus(status: MaintenanceTask['status']): Promise<MaintenanceTask[]>;
  findUpcoming(days?: number): Promise<MaintenanceTask[]>;
  findOverdue(date?: string): Promise<MaintenanceTask[]>;
  findByAssignee(assignedTo: string): Promise<MaintenanceTask[]>;
  search(query: string): Promise<MaintenanceTask[]>;
}

/**
 * Service record repository interface
 */
export interface ServiceRecordRepository extends BaseRepository<ServiceRecord> {
  findByTaskId(taskId: string): Promise<ServiceRecord[]>;
  findByPerformer(performedBy: string): Promise<ServiceRecord[]>;
  findByDateRange(startDate: string, endDate: string): Promise<ServiceRecord[]>;
  findByEquipmentId(equipmentId: string): Promise<ServiceRecord[]>;
}

/**
 * Machine log entry repository interface
 */
export interface MachineLogRepository extends BaseRepository<MachineLogEntry> {
  findByEquipmentId(equipmentId: string, limit?: number): Promise<MachineLogEntry[]>;
  findByDateRange(equipmentId: string, startDate: string, endDate: string): Promise<MachineLogEntry[]>;
  findByErrorCode(errorCode: string): Promise<MachineLogEntry[]>;
  findByMetric(metricName: string): Promise<MachineLogEntry[]>;
  findRecentLogs(equipmentId: string, hours?: number): Promise<MachineLogEntry[]>;
}

/**
 * Dashboard repository interface
 */
export interface DashboardRepository {
  getDashboardSummary(): Promise<DashboardSummary>;
  getRecentActivity(limit?: number): Promise<any[]>;
  getEquipmentStatusCounts(): Promise<Record<string, number>>;
  getMaintenanceStatusCounts(): Promise<Record<string, number>>;
}

/**
 * Settings data types
 */
export interface Location {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Manufacturer {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MetrologyToolType {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsumableMaterial {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsumableType {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Settings repository interface
 */
export interface SettingsRepository {
  // Locations
  getAllLocations(): Promise<Location[]>;
  createLocation(name: string): Promise<Location>;
  updateLocation(id: string, name: string): Promise<Location>;
  deleteLocation(id: string): Promise<void>;
  
  // Manufacturers
  getAllManufacturers(): Promise<Manufacturer[]>;
  createManufacturer(name: string): Promise<Manufacturer>;
  updateManufacturer(id: string, name: string): Promise<Manufacturer>;
  deleteManufacturer(id: string): Promise<void>;
  
  // Metrology Tool Types
  getAllMetrologyToolTypes(): Promise<MetrologyToolType[]>;
  createMetrologyToolType(name: string): Promise<MetrologyToolType>;
  updateMetrologyToolType(id: string, name: string): Promise<MetrologyToolType>;
  deleteMetrologyToolType(id: string): Promise<void>;
  
  // Consumable Materials
  getAllConsumableMaterials(): Promise<ConsumableMaterial[]>;
  createConsumableMaterial(name: string): Promise<ConsumableMaterial>;
  updateConsumableMaterial(id: string, name: string): Promise<ConsumableMaterial>;
  deleteConsumableMaterial(id: string): Promise<void>;
  
  // Consumable Types
  getAllConsumableTypes(): Promise<ConsumableType[]>;
  createConsumableType(name: string): Promise<ConsumableType>;
  updateConsumableType(id: string, name: string): Promise<ConsumableType>;
  deleteConsumableType(id: string): Promise<void>;
}

/**
 * Unit of Work pattern for managing multiple repositories
 */
export interface UnitOfWork {
  equipment: EquipmentRepository;
  metrologyTools: MetrologyToolRepository;
  calibrationLogs: CalibrationLogRepository;
  consumables: ConsumableRepository;
  maintenanceTasks: MaintenanceTaskRepository;
  serviceRecords: ServiceRecordRepository;
  machineLogs: MachineLogRepository;
  dashboard: DashboardRepository;
  settings: SettingsRepository;
  
  /**
   * Execute multiple operations in a single transaction
   */
  executeTransaction<T>(operation: (uow: UnitOfWork) => Promise<T>): Promise<T>;
}

/**
 * Database error types
 */
export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class NotFoundError extends DatabaseError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends DatabaseError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DuplicateError extends DatabaseError {
  constructor(resource: string, field: string) {
    super(`${resource} with this ${field} already exists`);
    this.name = 'DuplicateError';
  }
}
