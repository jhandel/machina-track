import Database from 'better-sqlite3';
import { getDatabase, executeTransaction } from '../connection';
import type { UnitOfWork } from '../interfaces';

// Import working repository implementations
import { PrismaEquipmentRepository } from './prisma/equipment';
import { PrismaMetrologyToolRepository } from './prisma/metrology-tools';
import { PrismaMaintenanceTaskRepository } from './prisma/maintenance-tasks';
import { PrismaCuttingToolRepository } from './prisma/cutting-tools';
import { PrismaCalibrationLogRepository } from './prisma/calibration-logs';
import { PrismaDashboardRepository } from './prisma/dashboard';
import { PrismaServiceRecordRepository } from './prisma/service-records';
import { PrismaMachineLogRepository } from './prisma/machine-logs';
import { PrismaSettingsRepository } from './prisma/settings';

export class PrismaUnitOfWork implements UnitOfWork {
  public readonly equipment: any;
  public readonly metrologyTools: any;
  public readonly calibrationLogs: any;
  public readonly cuttingTools: any;
  public readonly maintenanceTasks: any;
  public readonly serviceRecords: any;
  public readonly machineLogs: any;
  public readonly dashboard: any;
  public readonly settings: any;

  constructor() {
    // Initialize repositories
    this.equipment = new PrismaEquipmentRepository();
    this.metrologyTools = new PrismaMetrologyToolRepository();
    this.calibrationLogs = new PrismaCalibrationLogRepository();
    this.cuttingTools = new PrismaCuttingToolRepository();
    this.maintenanceTasks = new PrismaMaintenanceTaskRepository();
    this.serviceRecords = new PrismaServiceRecordRepository();
    this.machineLogs = new PrismaMachineLogRepository();
    this.dashboard = new PrismaDashboardRepository(); // Dashboard repo remains as is
    this.settings = new PrismaSettingsRepository();
  }

  async executeTransaction<T>(operation: (uow: UnitOfWork) => Promise<T>): Promise<T> {
    // Prisma handles transactions differently; implement if needed
    return await operation(this);
  }
}

// Singleton instance
let unitOfWork: UnitOfWork | null = null;

export function getUnitOfWork(): UnitOfWork {
  if (!unitOfWork) {
    unitOfWork = new PrismaUnitOfWork();
  }
  return unitOfWork;
}

export function resetUnitOfWork(): void {
  unitOfWork = null;
}
