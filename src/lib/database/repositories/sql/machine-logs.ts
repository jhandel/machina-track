import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type { MachineLogEntry } from '@/lib/types';
import type { MachineLogRepository } from '../../interfaces';
import { DatabaseError, NotFoundError } from '../../interfaces';

export class SqliteMachineLogRepository implements MachineLogRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<MachineLogEntry | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM machine_log_entries WHERE id = ?
      `);
      const row = stmt.get(id) as any;
      return row ? this.mapRowToMachineLogEntry(row) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find machine log entry by id: ${error}`);
    }
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<MachineLogEntry[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM machine_log_entries 
        ORDER BY timestamp DESC 
        LIMIT ? OFFSET ?
      `);
      const rows = stmt.all(limit, offset) as any[];
      return rows.map(row => this.mapRowToMachineLogEntry(row));
    } catch (error) {
      throw new DatabaseError(`Failed to find all machine log entries: ${error}`);
    }
  }

  async create(item: Omit<MachineLogEntry, 'id'>): Promise<MachineLogEntry> {
    try {
      const id = uuidv4();
      
      const stmt = this.db.prepare(`
        INSERT INTO machine_log_entries (
          id, equipment_id, timestamp, error_code, metric_name, metric_value, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id,
        item.equipmentId,
        item.timestamp,
        item.errorCode || null,
        item.metricName,
        typeof item.metricValue === 'string' ? item.metricValue : String(item.metricValue),
        item.notes || null
      );

      const created = await this.findById(id);
      if (!created) {
        throw new DatabaseError('Failed to create machine log entry');
      }
      return created;
    } catch (error: any) {
      throw new DatabaseError(`Failed to create machine log entry: ${error.message}`);
    }
  }

  async update(id: string, item: Partial<MachineLogEntry>): Promise<MachineLogEntry | null> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        return null;
      }

      const fields: string[] = [];
      const values: any[] = [];

      if (item.timestamp !== undefined) {
        fields.push('timestamp = ?');
        values.push(item.timestamp);
      }
      if (item.errorCode !== undefined) {
        fields.push('error_code = ?');
        values.push(item.errorCode);
      }
      if (item.metricName !== undefined) {
        fields.push('metric_name = ?');
        values.push(item.metricName);
      }
      if (item.metricValue !== undefined) {
        fields.push('metric_value = ?');
        values.push(typeof item.metricValue === 'string' ? item.metricValue : String(item.metricValue));
      }
      if (item.notes !== undefined) {
        fields.push('notes = ?');
        values.push(item.notes);
      }

      if (fields.length === 0) {
        return existing;
      }

      values.push(id);
      const stmt = this.db.prepare(`
        UPDATE machine_log_entries SET ${fields.join(', ')} WHERE id = ?
      `);
      stmt.run(...values);

      return await this.findById(id);
    } catch (error: any) {
      throw new DatabaseError(`Failed to update machine log entry: ${error.message}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare('DELETE FROM machine_log_entries WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to delete machine log entry: ${error}`);
    }
  }

  async count(): Promise<number> {
    try {
      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM machine_log_entries');
      const result = stmt.get() as { count: number };
      return result.count;
    } catch (error) {
      throw new DatabaseError(`Failed to count machine log entries: ${error}`);
    }
  }

  async findByEquipmentId(equipmentId: string, limit: number = 100): Promise<MachineLogEntry[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM machine_log_entries 
        WHERE equipment_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      `);
      const rows = stmt.all(equipmentId, limit) as any[];
      return rows.map(row => this.mapRowToMachineLogEntry(row));
    } catch (error) {
      throw new DatabaseError(`Failed to find machine log entries by equipment: ${error}`);
    }
  }

  async findByDateRange(equipmentId: string, startDate: string, endDate: string): Promise<MachineLogEntry[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM machine_log_entries 
        WHERE equipment_id = ? AND timestamp >= ? AND timestamp <= ?
        ORDER BY timestamp DESC
      `);
      const rows = stmt.all(equipmentId, startDate, endDate) as any[];
      return rows.map(row => this.mapRowToMachineLogEntry(row));
    } catch (error) {
      throw new DatabaseError(`Failed to find machine log entries by date range: ${error}`);
    }
  }

  async findByErrorCode(errorCode: string): Promise<MachineLogEntry[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM machine_log_entries 
        WHERE error_code = ? 
        ORDER BY timestamp DESC
      `);
      const rows = stmt.all(errorCode) as any[];
      return rows.map(row => this.mapRowToMachineLogEntry(row));
    } catch (error) {
      throw new DatabaseError(`Failed to find machine log entries by error code: ${error}`);
    }
  }

  async findByMetric(metricName: string): Promise<MachineLogEntry[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM machine_log_entries 
        WHERE metric_name = ? 
        ORDER BY timestamp DESC
      `);
      const rows = stmt.all(metricName) as any[];
      return rows.map(row => this.mapRowToMachineLogEntry(row));
    } catch (error) {
      throw new DatabaseError(`Failed to find machine log entries by metric: ${error}`);
    }
  }

  async findRecentLogs(equipmentId: string, hours: number = 24): Promise<MachineLogEntry[]> {
    try {
      const sinceDate = new Date();
      sinceDate.setHours(sinceDate.getHours() - hours);
      const sinceDateStr = sinceDate.toISOString();
      
      const stmt = this.db.prepare(`
        SELECT * FROM machine_log_entries 
        WHERE equipment_id = ? AND timestamp >= ?
        ORDER BY timestamp DESC
      `);
      const rows = stmt.all(equipmentId, sinceDateStr) as any[];
      return rows.map(row => this.mapRowToMachineLogEntry(row));
    } catch (error) {
      throw new DatabaseError(`Failed to find recent machine log entries: ${error}`);
    }
  }

  private mapRowToMachineLogEntry(row: any): MachineLogEntry {
    // Parse metric value back to number if it's a numeric string
    let metricValue: string | number = row.metric_value;
    const numericValue = Number(row.metric_value);
    if (!isNaN(numericValue) && isFinite(numericValue)) {
      metricValue = numericValue;
    }

    return {
      id: row.id,
      equipmentId: row.equipment_id,
      timestamp: row.timestamp,
      errorCode: row.error_code,
      metricName: row.metric_name,
      metricValue: metricValue,
      notes: row.notes
    };
  }
}
