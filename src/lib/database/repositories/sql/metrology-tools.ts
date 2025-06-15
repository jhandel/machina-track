import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type { MetrologyTool } from '@/lib/types';
import type { MetrologyToolRepository } from '../../interfaces';
import { DatabaseError, NotFoundError, DuplicateError } from '../../interfaces';

export class SqliteMetrologyToolRepository implements MetrologyToolRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<MetrologyTool | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM metrology_tools WHERE id = ?
      `);
      const row = stmt.get(id) as any;
      return row ? this.mapRowToMetrologyTool(row) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find metrology tool by id: ${error}`);
    }
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<MetrologyTool[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM metrology_tools 
        ORDER BY updated_at DESC 
        LIMIT ? OFFSET ?
      `);
      const rows = stmt.all(limit, offset) as any[];
      return rows.map(row => this.mapRowToMetrologyTool(row));
    } catch (error) {
      throw new DatabaseError(`Failed to find all metrology tools: ${error}`);
    }
  }

  async create(item: Omit<MetrologyTool, 'id'>): Promise<MetrologyTool> {
    try {
      const id = uuidv4();
      const stmt = this.db.prepare(`
        INSERT INTO metrology_tools (
          id, name, type, serial_number, manufacturer, calibration_interval_days,
          last_calibration_date, next_calibration_date, location, status, image_url, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id,
        item.name,
        item.type,
        item.serialNumber,
        item.manufacturer || null,
        item.calibrationIntervalDays,
        item.lastCalibrationDate || null,
        item.nextCalibrationDate || null,
        item.location || null,
        item.status,
        item.imageUrl || null,
        item.notes || null
      );

      const created = await this.findById(id);
      if (!created) {
        throw new DatabaseError('Failed to create metrology tool');
      }
      return created;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new DuplicateError('Metrology tool', 'serial number');
      }
      throw new DatabaseError(`Failed to create metrology tool: ${error.message}`);
    }
  }

  async update(id: string, item: Partial<MetrologyTool>): Promise<MetrologyTool | null> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        return null;
      }

      const fields: string[] = [];
      const values: any[] = [];

      if (item.name !== undefined) {
        fields.push('name = ?');
        values.push(item.name);
      }
      if (item.type !== undefined) {
        fields.push('type = ?');
        values.push(item.type);
      }
      if (item.serialNumber !== undefined) {
        fields.push('serial_number = ?');
        values.push(item.serialNumber);
      }
      if (item.manufacturer !== undefined) {
        fields.push('manufacturer = ?');
        values.push(item.manufacturer);
      }
      if (item.calibrationIntervalDays !== undefined) {
        fields.push('calibration_interval_days = ?');
        values.push(item.calibrationIntervalDays);
      }
      if (item.lastCalibrationDate !== undefined) {
        fields.push('last_calibration_date = ?');
        values.push(item.lastCalibrationDate);
      }
      if (item.nextCalibrationDate !== undefined) {
        fields.push('next_calibration_date = ?');
        values.push(item.nextCalibrationDate);
      }
      if (item.location !== undefined) {
        fields.push('location = ?');
        values.push(item.location);
      }
      if (item.status !== undefined) {
        fields.push('status = ?');
        values.push(item.status);
      }
      if (item.imageUrl !== undefined) {
        fields.push('image_url = ?');
        values.push(item.imageUrl);
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
        UPDATE metrology_tools SET ${fields.join(', ')} WHERE id = ?
      `);
      stmt.run(...values);

      return await this.findById(id);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new DuplicateError('Metrology tool', 'serial number');
      }
      throw new DatabaseError(`Failed to update metrology tool: ${error.message}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare('DELETE FROM metrology_tools WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to delete metrology tool: ${error}`);
    }
  }

  async count(): Promise<number> {
    try {
      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM metrology_tools');
      const result = stmt.get() as { count: number };
      return result.count;
    } catch (error) {
      throw new DatabaseError(`Failed to count metrology tools: ${error}`);
    }
  }

  async findByStatus(status: MetrologyTool['status']): Promise<MetrologyTool[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM metrology_tools WHERE status = ? ORDER BY updated_at DESC
      `);
      const rows = stmt.all(status) as any[];
      return rows.map(row => this.mapRowToMetrologyTool(row));
    } catch (error) {
      throw new DatabaseError(`Failed to find metrology tools by status: ${error}`);
    }
  }

  async findDueForCalibration(date?: string): Promise<MetrologyTool[]> {
    try {
      const checkDate = date || new Date().toISOString().split('T')[0];
      const stmt = this.db.prepare(`
        SELECT * FROM metrology_tools 
        WHERE next_calibration_date <= ? 
        AND status != 'out_of_service'
        ORDER BY next_calibration_date ASC
      `);
      const rows = stmt.all(checkDate) as any[];
      return rows.map(row => this.mapRowToMetrologyTool(row));
    } catch (error) {
      throw new DatabaseError(`Failed to find tools due for calibration: ${error}`);
    }
  }

  async findOverdueCalibration(date?: string): Promise<MetrologyTool[]> {
    try {
      const checkDate = date || new Date().toISOString().split('T')[0];
      const stmt = this.db.prepare(`
        SELECT * FROM metrology_tools 
        WHERE next_calibration_date < ? 
        AND status != 'out_of_service'
        ORDER BY next_calibration_date ASC
      `);
      const rows = stmt.all(checkDate) as any[];
      return rows.map(row => this.mapRowToMetrologyTool(row));
    } catch (error) {
      throw new DatabaseError(`Failed to find overdue calibration tools: ${error}`);
    }
  }

  async findBySerialNumber(serialNumber: string): Promise<MetrologyTool | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM metrology_tools WHERE serial_number = ?
      `);
      const row = stmt.get(serialNumber) as any;
      return row ? this.mapRowToMetrologyTool(row) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find metrology tool by serial number: ${error}`);
    }
  }

  async search(query: string): Promise<MetrologyTool[]> {
    try {
      const searchTerm = `%${query}%`;
      const stmt = this.db.prepare(`
        SELECT * FROM metrology_tools 
        WHERE name LIKE ? OR type LIKE ? OR serial_number LIKE ? OR manufacturer LIKE ?
        ORDER BY name
      `);
      const rows = stmt.all(searchTerm, searchTerm, searchTerm, searchTerm) as any[];
      return rows.map(row => this.mapRowToMetrologyTool(row));
    } catch (error) {
      throw new DatabaseError(`Failed to search metrology tools: ${error}`);
    }
  }

  private mapRowToMetrologyTool(row: any): MetrologyTool {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      serialNumber: row.serial_number,
      manufacturer: row.manufacturer,
      calibrationIntervalDays: row.calibration_interval_days,
      lastCalibrationDate: row.last_calibration_date,
      nextCalibrationDate: row.next_calibration_date,
      location: row.location,
      status: row.status,
      imageUrl: row.image_url,
      notes: row.notes,
      // calibrationLogIds will be populated by joining with calibration_logs
      calibrationLogIds: []
    };
  }
}

// Helper function to get calibration log IDs for a metrology tool
export async function getCalibrationLogIds(db: Database.Database, toolId: string): Promise<string[]> {
  const stmt = db.prepare('SELECT id FROM calibration_logs WHERE metrology_tool_id = ? ORDER BY date DESC');
  const rows = stmt.all(toolId) as { id: string }[];
  return rows.map(row => row.id);
}
