import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type { CalibrationLog } from '@/lib/types';
import type { CalibrationLogRepository } from '../../interfaces';
import { DatabaseError, NotFoundError } from '../../interfaces';

export class SqliteCalibrationLogRepository implements CalibrationLogRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<CalibrationLog | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM calibration_logs WHERE id = ?
      `);
      const row = stmt.get(id) as any;
      return row ? this.mapRowToCalibrationLog(row) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find calibration log by id: ${error}`);
    }
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<CalibrationLog[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM calibration_logs 
        ORDER BY date DESC 
        LIMIT ? OFFSET ?
      `);
      const rows = stmt.all(limit, offset) as any[];
      return rows.map(row => this.mapRowToCalibrationLog(row));
    } catch (error) {
      throw new DatabaseError(`Failed to find all calibration logs: ${error}`);
    }
  }

  async create(item: Omit<CalibrationLog, 'id'>): Promise<CalibrationLog> {
    try {
      const id = uuidv4();
      const stmt = this.db.prepare(`
        INSERT INTO calibration_logs (
          id, metrology_tool_id, date, performed_by, notes, result, 
          certificate_url, next_due_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id,
        item.metrologyToolId,
        item.date,
        item.performedBy,
        item.notes || null,
        item.result,
        item.certificateUrl || null,
        item.nextDueDate || null
      );

      const created = await this.findById(id);
      if (!created) {
        throw new DatabaseError('Failed to create calibration log');
      }
      return created;
    } catch (error: any) {
      throw new DatabaseError(`Failed to create calibration log: ${error.message}`);
    }
  }

  async update(id: string, item: Partial<CalibrationLog>): Promise<CalibrationLog | null> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        return null;
      }

      const fields: string[] = [];
      const values: any[] = [];

      if (item.metrologyToolId !== undefined) {
        fields.push('metrology_tool_id = ?');
        values.push(item.metrologyToolId);
      }
      if (item.date !== undefined) {
        fields.push('date = ?');
        values.push(item.date);
      }
      if (item.performedBy !== undefined) {
        fields.push('performed_by = ?');
        values.push(item.performedBy);
      }
      if (item.notes !== undefined) {
        fields.push('notes = ?');
        values.push(item.notes);
      }
      if (item.result !== undefined) {
        fields.push('result = ?');
        values.push(item.result);
      }
      if (item.certificateUrl !== undefined) {
        fields.push('certificate_url = ?');
        values.push(item.certificateUrl);
      }
      if (item.nextDueDate !== undefined) {
        fields.push('next_due_date = ?');
        values.push(item.nextDueDate);
      }

      if (fields.length === 0) {
        return existing;
      }

      values.push(id);
      const stmt = this.db.prepare(`
        UPDATE calibration_logs SET ${fields.join(', ')} WHERE id = ?
      `);
      stmt.run(...values);

      return await this.findById(id);
    } catch (error: any) {
      throw new DatabaseError(`Failed to update calibration log: ${error.message}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare('DELETE FROM calibration_logs WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to delete calibration log: ${error}`);
    }
  }

  async count(): Promise<number> {
    try {
      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM calibration_logs');
      const result = stmt.get() as { count: number };
      return result.count;
    } catch (error) {
      throw new DatabaseError(`Failed to count calibration logs: ${error}`);
    }
  }

  async findByToolId(toolId: string): Promise<CalibrationLog[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM calibration_logs 
        WHERE metrology_tool_id = ? 
        ORDER BY date DESC
      `);
      const rows = stmt.all(toolId) as any[];
      return rows.map(row => this.mapRowToCalibrationLog(row));
    } catch (error) {
      throw new DatabaseError(`Failed to find calibration logs by tool: ${error}`);
    }
  }

  async findByDateRange(startDate: string, endDate: string): Promise<CalibrationLog[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM calibration_logs 
        WHERE date >= ? AND date <= ?
        ORDER BY date DESC
      `);
      const rows = stmt.all(startDate, endDate) as any[];
      return rows.map(row => this.mapRowToCalibrationLog(row));
    } catch (error) {
      throw new DatabaseError(`Failed to find calibration logs by date range: ${error}`);
    }
  }

  async findByPerformer(performedBy: string): Promise<CalibrationLog[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM calibration_logs 
        WHERE performed_by = ? 
        ORDER BY date DESC
      `);
      const rows = stmt.all(performedBy) as any[];
      return rows.map(row => this.mapRowToCalibrationLog(row));
    } catch (error) {
      throw new DatabaseError(`Failed to find calibration logs by performer: ${error}`);
    }
  }

  private mapRowToCalibrationLog(row: any): CalibrationLog {
    return {
      id: row.id,
      metrologyToolId: row.metrology_tool_id,
      date: row.date,
      performedBy: row.performed_by,
      notes: row.notes,
      result: row.result,
      certificateUrl: row.certificate_url,
      nextDueDate: row.next_due_date
    };
  }
}
