import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type { ServiceRecord } from '@/lib/types';
import type { ServiceRecordRepository } from '../../interfaces';
import { DatabaseError, NotFoundError } from '../../interfaces';

export class SqliteServiceRecordRepository implements ServiceRecordRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<ServiceRecord | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM service_records WHERE id = ?
      `);
      const row = stmt.get(id) as any;
      return row ? await this.mapRowToServiceRecord(row) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find service record by id: ${error}`);
    }
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<ServiceRecord[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM service_records 
        ORDER BY date DESC 
        LIMIT ? OFFSET ?
      `);
      const rows = stmt.all(limit, offset) as any[];
      const records = await Promise.all(rows.map(row => this.mapRowToServiceRecord(row)));
      return records;
    } catch (error) {
      throw new DatabaseError(`Failed to find all service records: ${error}`);
    }
  }

  async create(item: Omit<ServiceRecord, 'id'>): Promise<ServiceRecord> {
    try {
      const id = uuidv4();
      
      const transaction = this.db.transaction(() => {
        // Insert main service record
        const stmt = this.db.prepare(`
          INSERT INTO service_records (
            id, maintenance_task_id, date, performed_by, description_of_work, cost, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
          id,
          item.maintenanceTaskId,
          item.date,
          item.performedBy,
          item.descriptionOfWork,
          item.cost || null,
          item.notes || null
        );

        // Insert attachments if provided
        if (item.attachments && item.attachments.length > 0) {
          const attachmentStmt = this.db.prepare(`
            INSERT INTO service_record_attachments (id, service_record_id, attachment_url)
            VALUES (?, ?, ?)
          `);
          
          for (const attachment of item.attachments) {
            attachmentStmt.run(uuidv4(), id, attachment);
          }
        }
      });
      
      transaction();

      const created = await this.findById(id);
      if (!created) {
        throw new DatabaseError('Failed to create service record');
      }
      return created;
    } catch (error: any) {
      throw new DatabaseError(`Failed to create service record: ${error.message}`);
    }
  }

  async update(id: string, item: Partial<ServiceRecord>): Promise<ServiceRecord | null> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        return null;
      }

      const transaction = this.db.transaction(() => {
        const fields: string[] = [];
        const values: any[] = [];

        if (item.maintenanceTaskId !== undefined) {
          fields.push('maintenance_task_id = ?');
          values.push(item.maintenanceTaskId);
        }
        if (item.date !== undefined) {
          fields.push('date = ?');
          values.push(item.date);
        }
        if (item.performedBy !== undefined) {
          fields.push('performed_by = ?');
          values.push(item.performedBy);
        }
        if (item.descriptionOfWork !== undefined) {
          fields.push('description_of_work = ?');
          values.push(item.descriptionOfWork);
        }
        if (item.cost !== undefined) {
          fields.push('cost = ?');
          values.push(item.cost);
        }
        if (item.notes !== undefined) {
          fields.push('notes = ?');
          values.push(item.notes);
        }

        if (fields.length > 0) {
          values.push(id);
          const stmt = this.db.prepare(`
            UPDATE service_records SET ${fields.join(', ')} WHERE id = ?
          `);
          stmt.run(...values);
        }

        // Update attachments if provided
        if (item.attachments !== undefined) {
          // Delete existing attachments
          const deleteAttachmentsStmt = this.db.prepare('DELETE FROM service_record_attachments WHERE service_record_id = ?');
          deleteAttachmentsStmt.run(id);
          
          // Insert new attachments
          if (item.attachments.length > 0) {
            const attachmentStmt = this.db.prepare(`
              INSERT INTO service_record_attachments (id, service_record_id, attachment_url)
              VALUES (?, ?, ?)
            `);
            
            for (const attachment of item.attachments) {
              attachmentStmt.run(uuidv4(), id, attachment);
            }
          }
        }
      });

      transaction();
      return await this.findById(id);
    } catch (error: any) {
      throw new DatabaseError(`Failed to update service record: ${error.message}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare('DELETE FROM service_records WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to delete service record: ${error}`);
    }
  }

  async count(): Promise<number> {
    try {
      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM service_records');
      const result = stmt.get() as { count: number };
      return result.count;
    } catch (error) {
      throw new DatabaseError(`Failed to count service records: ${error}`);
    }
  }

  async findByTaskId(taskId: string): Promise<ServiceRecord[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM service_records 
        WHERE maintenance_task_id = ? 
        ORDER BY date DESC
      `);
      const rows = stmt.all(taskId) as any[];
      const records = await Promise.all(rows.map(row => this.mapRowToServiceRecord(row)));
      return records;
    } catch (error) {
      throw new DatabaseError(`Failed to find service records by task: ${error}`);
    }
  }

  async findByPerformer(performedBy: string): Promise<ServiceRecord[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM service_records 
        WHERE performed_by = ? 
        ORDER BY date DESC
      `);
      const rows = stmt.all(performedBy) as any[];
      const records = await Promise.all(rows.map(row => this.mapRowToServiceRecord(row)));
      return records;
    } catch (error) {
      throw new DatabaseError(`Failed to find service records by performer: ${error}`);
    }
  }

  async findByDateRange(startDate: string, endDate: string): Promise<ServiceRecord[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM service_records 
        WHERE date >= ? AND date <= ?
        ORDER BY date DESC
      `);
      const rows = stmt.all(startDate, endDate) as any[];
      const records = await Promise.all(rows.map(row => this.mapRowToServiceRecord(row)));
      return records;
    } catch (error) {
      throw new DatabaseError(`Failed to find service records by date range: ${error}`);
    }
  }

  async findByEquipmentId(equipmentId: string): Promise<ServiceRecord[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT sr.* FROM service_records sr
        JOIN maintenance_tasks mt ON sr.maintenance_task_id = mt.id
        WHERE mt.equipment_id = ?
        ORDER BY sr.date DESC
      `);
      const rows = stmt.all(equipmentId) as any[];
      const records = await Promise.all(rows.map(row => this.mapRowToServiceRecord(row)));
      return records;
    } catch (error) {
      throw new DatabaseError(`Failed to find service records by equipment: ${error}`);
    }
  }

  private async mapRowToServiceRecord(row: any): Promise<ServiceRecord> {
    // Get attachments for this service record
    const attachmentStmt = this.db.prepare(`
      SELECT attachment_url FROM service_record_attachments WHERE service_record_id = ?
    `);
    const attachmentRows = attachmentStmt.all(row.id) as { attachment_url: string }[];
    const attachments = attachmentRows.map(attachment => attachment.attachment_url);

    return {
      id: row.id,
      maintenanceTaskId: row.maintenance_task_id,
      date: row.date,
      performedBy: row.performed_by,
      descriptionOfWork: row.description_of_work,
      cost: row.cost,
      notes: row.notes,
      attachments: attachments.length > 0 ? attachments : undefined
    };
  }
}
