
export interface Equipment {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  location: string;
  purchaseDate?: string; // ISO date string
  status: 'operational' | 'maintenance' | 'decommissioned';
  maintenanceScheduleIds?: string[]; 
  imageUrl?: string;
  notes?: string;
}

export interface MetrologyTool {
  id: string;
  name: string;
  type: string; 
  serialNumber: string;
  manufacturer?: string;
  calibrationIntervalDays: number; 
  lastCalibrationDate?: string; // ISO date string
  nextCalibrationDate?: string; // ISO date string
  calibrationLogIds: string[];
  location?: string;
  status: 'calibrated' | 'due_calibration' | 'out_of_service' | 'awaiting_calibration';
  imageUrl?: string;
  notes?: string;
}

export interface CalibrationLog {
  id: string;
  metrologyToolId: string;
  date: string; // ISO date string
  performedBy: string;
  notes?: string;
  result: 'pass' | 'fail' | 'adjusted';
  certificateUrl?: string;
  nextDueDate?: string; // ISO date string
}

export interface CuttingTool {
  id: string;
  name: string; 
  type: string; 
  material?: string; 
  size?: string; 
  quantity: number;
  minQuantity: number; 
  location: string; 
  toolLifeHours?: number; 
  remainingToolLifeHours?: number;
  lastUsedDate?: string; // ISO date string
  endOfLifeDate?: string; // ISO date string
  supplier?: string;
  costPerUnit?: number;
  imageUrl?: string;
  notes?: string;
}

export interface MaintenanceTask {
  id: string;
  equipmentId: string;
  description: string;
  frequencyDays?: number; // Optional if it's a one-time task
  lastPerformedDate?: string; // ISO date string
  nextDueDate?: string; // ISO date string
  assignedTo?: string;
  notes?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'skipped';
  partsUsed?: { partName: string; quantity: number }[];
  serviceRecordIds?: string[];
}

export interface ServiceRecord {
  id: string;
  maintenanceTaskId: string;
  date: string; // ISO date string
  performedBy: string;
  descriptionOfWork: string;
  cost?: number;
  notes?: string;
  attachments?: string[]; // URLs to receipts, reports etc.
}

export interface MachineLogEntry {
  id?: string;
  equipmentId: string;
  timestamp: string; // ISO date string
  errorCode?: string;
  metricName: string;
  metricValue: number | string;
  notes?: string;
}

// Generic type for form modes
export type FormMode = 'create' | 'edit' | 'view';

// For dashboard summaries
export interface DashboardSummary {
  upcomingMaintenanceCount: number;
  lowInventoryCount: number;
  overdueCalibrationsCount: number;
}
