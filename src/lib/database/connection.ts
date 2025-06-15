import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

/**
 * Initialize and return SQLite database connection
 * Implements singleton pattern for connection management
 */
export function getDatabase(): Database.Database {
  if (db) {
    return db;
  }

  try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Initialize database connection
    const dbPath = path.join(dataDir, 'machina-track.db');
    db = new Database(dbPath);
    
    // Enable foreign keys and WAL mode for better performance
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    
    // Initialize schema
    initializeSchema();
    
    console.log(`Database initialized at: ${dbPath}`);
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Initialize database schema
 */
function initializeSchema(): void {
  if (!db) throw new Error('Database not initialized');

  try {
    // Embedded schema to avoid file system issues in serverless environments
    const schema = `
-- MachinaTrack Database Schema
-- SQLite Schema based on TypeScript interfaces

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    model TEXT NOT NULL,
    serial_number TEXT NOT NULL UNIQUE,
    location TEXT NOT NULL,
    purchase_date TEXT,
    status TEXT NOT NULL CHECK (status IN ('operational', 'maintenance', 'decommissioned')) DEFAULT 'operational',
    image_url TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Metrology tools table
CREATE TABLE IF NOT EXISTS metrology_tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    serial_number TEXT NOT NULL UNIQUE,
    manufacturer TEXT,
    calibration_interval_days INTEGER NOT NULL,
    last_calibration_date TEXT,
    next_calibration_date TEXT,
    location TEXT,
    status TEXT NOT NULL CHECK (status IN ('calibrated', 'due_calibration', 'out_of_service', 'awaiting_calibration')) DEFAULT 'calibrated',
    image_url TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Calibration logs table
CREATE TABLE IF NOT EXISTS calibration_logs (
    id TEXT PRIMARY KEY,
    metrology_tool_id TEXT NOT NULL,
    date TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    notes TEXT,
    result TEXT NOT NULL CHECK (result IN ('pass', 'fail', 'adjusted')),
    certificate_url TEXT,
    next_due_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (metrology_tool_id) REFERENCES metrology_tools (id) ON DELETE CASCADE
);

-- Cutting tools table
CREATE TABLE IF NOT EXISTS cutting_tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    material TEXT,
    size TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER NOT NULL DEFAULT 0,
    location TEXT NOT NULL,
    tool_life_hours REAL,
    remaining_tool_life_hours REAL,
    last_used_date TEXT,
    end_of_life_date TEXT,
    supplier TEXT,
    cost_per_unit REAL,
    image_url TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance tasks table
CREATE TABLE IF NOT EXISTS maintenance_tasks (
    id TEXT PRIMARY KEY,
    equipment_id TEXT NOT NULL,
    description TEXT NOT NULL,
    frequency_days INTEGER,
    last_performed_date TEXT,
    next_due_date TEXT,
    assigned_to TEXT,
    notes TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'skipped')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment (id) ON DELETE CASCADE
);

-- Parts used in maintenance (many-to-many relationship)
CREATE TABLE IF NOT EXISTS maintenance_parts (
    id TEXT PRIMARY KEY,
    maintenance_task_id TEXT NOT NULL,
    part_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (maintenance_task_id) REFERENCES maintenance_tasks (id) ON DELETE CASCADE
);

-- Service records table
CREATE TABLE IF NOT EXISTS service_records (
    id TEXT PRIMARY KEY,
    maintenance_task_id TEXT NOT NULL,
    date TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    description_of_work TEXT NOT NULL,
    cost REAL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (maintenance_task_id) REFERENCES maintenance_tasks (id) ON DELETE CASCADE
);

-- Service record attachments (many-to-many relationship)
CREATE TABLE IF NOT EXISTS service_record_attachments (
    id TEXT PRIMARY KEY,
    service_record_id TEXT NOT NULL,
    attachment_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_record_id) REFERENCES service_records (id) ON DELETE CASCADE
);

-- Machine log entries table
CREATE TABLE IF NOT EXISTS machine_log_entries (
    id TEXT PRIMARY KEY,
    equipment_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    error_code TEXT,
    metric_name TEXT NOT NULL,
    metric_value TEXT NOT NULL, -- Store as TEXT to handle both numbers and strings
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment (id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment (status);
CREATE INDEX IF NOT EXISTS idx_equipment_location ON equipment (location);
CREATE INDEX IF NOT EXISTS idx_metrology_tools_status ON metrology_tools (status);
CREATE INDEX IF NOT EXISTS idx_metrology_tools_next_calibration ON metrology_tools (next_calibration_date);
CREATE INDEX IF NOT EXISTS idx_cutting_tools_location ON cutting_tools (location);
CREATE INDEX IF NOT EXISTS idx_cutting_tools_quantity ON cutting_tools (quantity);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_status ON maintenance_tasks (status);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_next_due ON maintenance_tasks (next_due_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_equipment ON maintenance_tasks (equipment_id);
CREATE INDEX IF NOT EXISTS idx_calibration_logs_tool ON calibration_logs (metrology_tool_id);
CREATE INDEX IF NOT EXISTS idx_service_records_task ON service_records (maintenance_task_id);
CREATE INDEX IF NOT EXISTS idx_machine_logs_equipment ON machine_log_entries (equipment_id);
CREATE INDEX IF NOT EXISTS idx_machine_logs_timestamp ON machine_log_entries (timestamp);

-- Triggers to update updated_at timestamps
CREATE TRIGGER IF NOT EXISTS equipment_updated_at 
    AFTER UPDATE ON equipment 
    BEGIN 
        UPDATE equipment SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; 
    END;

CREATE TRIGGER IF NOT EXISTS metrology_tools_updated_at 
    AFTER UPDATE ON metrology_tools 
    BEGIN 
        UPDATE metrology_tools SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; 
    END;

CREATE TRIGGER IF NOT EXISTS cutting_tools_updated_at 
    AFTER UPDATE ON cutting_tools 
    BEGIN 
        UPDATE cutting_tools SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; 
    END;

CREATE TRIGGER IF NOT EXISTS maintenance_tasks_updated_at 
    AFTER UPDATE ON maintenance_tasks 
    BEGIN 
        UPDATE maintenance_tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; 
    END;
`;
    
    // Execute schema as a single statement
    db.exec(schema);
    
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

/**
 * Execute a transaction
 */
export function executeTransaction<T>(
  operation: (db: Database.Database) => T
): T {
  const database = getDatabase();
  const transaction = database.transaction(() => operation(database));
  return transaction();
}

/**
 * Health check for database
 */
export function checkDatabaseHealth(): boolean {
  try {
    const database = getDatabase();
    const result = database.prepare('SELECT 1 as health').get() as { health: number } | undefined;
    return result ? result.health === 1 : false;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});
