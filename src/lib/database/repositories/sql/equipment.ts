import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type { Equipment } from '@/lib/types';
import type { EquipmentRepository } from '../../interfaces';
import { DatabaseError, NotFoundError, DuplicateError } from '../../interfaces';

export class SqliteEquipmentRepository implements EquipmentRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<Equipment | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM equipment WHERE id = ?
      `);
      const row = stmt.get(id) as any;
      return row ? this.mapRowToEquipment(row) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find equipment by id: ${error}`);
    }
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<Equipment[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM equipment 
        ORDER BY updated_at DESC 
        LIMIT ? OFFSET ?
      `);
      const rows = stmt.all(limit, offset) as any[];
      return rows.map(row => this.mapRowToEquipment(row));
    } catch (error) {
      throw new DatabaseError(`Failed to find all equipment: ${error}`);
    }
  }

  async create(item: Omit<Equipment, 'id'>): Promise<Equipment> {
    try {
      const id = uuidv4();
      const stmt = this.db.prepare(`
        INSERT INTO equipment (
          id, name, model, serial_number, location, purchase_date, 
          status, image_url, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id,
        item.name,
        item.model,
        item.serialNumber,
        item.location,
        item.purchaseDate || null,
        item.status,
        item.imageUrl || null,
        item.notes || null
      );

      const created = await this.findById(id);
      if (!created) {
        throw new DatabaseError('Failed to create equipment');
      }
      return created;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new DuplicateError('Equipment', 'serial number');
      }
      throw new DatabaseError(`Failed to create equipment: ${error.message}`);
    }
  }

  async update(id: string, item: Partial<Equipment>): Promise<Equipment | null> {
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
      if (item.model !== undefined) {
        fields.push('model = ?');
        values.push(item.model);
      }
      if (item.serialNumber !== undefined) {
        fields.push('serial_number = ?');
        values.push(item.serialNumber);
      }
      if (item.location !== undefined) {
        fields.push('location = ?');
        values.push(item.location);
      }
      if (item.purchaseDate !== undefined) {
        fields.push('purchase_date = ?');
        values.push(item.purchaseDate);
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
        UPDATE equipment SET ${fields.join(', ')} WHERE id = ?
      `);
      stmt.run(...values);

      return await this.findById(id);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new DuplicateError('Equipment', 'serial number');
      }
      throw new DatabaseError(`Failed to update equipment: ${error.message}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare('DELETE FROM equipment WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to delete equipment: ${error}`);
    }
  }

  async count(): Promise<number> {
    try {
      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM equipment');
      const result = stmt.get() as { count: number };
      return result.count;
    } catch (error) {
      throw new DatabaseError(`Failed to count equipment: ${error}`);
    }
  }

  async findByStatus(status: Equipment['status']): Promise<Equipment[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM equipment WHERE status = ? ORDER BY updated_at DESC
      `);
      const rows = stmt.all(status) as any[];
      return rows.map(row => this.mapRowToEquipment(row));
    } catch (error) {
      throw new DatabaseError(`Failed to find equipment by status: ${error}`);
    }
  }

  async findByLocation(location: string): Promise<Equipment[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM equipment WHERE location = ? ORDER BY name
      `);
      const rows = stmt.all(location) as any[];
      return rows.map(row => this.mapRowToEquipment(row));
    } catch (error) {
      throw new DatabaseError(`Failed to find equipment by location: ${error}`);
    }
  }

  async findBySerialNumber(serialNumber: string): Promise<Equipment | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM equipment WHERE serial_number = ?
      `);
      const row = stmt.get(serialNumber) as any;
      return row ? this.mapRowToEquipment(row) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find equipment by serial number: ${error}`);
    }
  }

  async search(query: string): Promise<Equipment[]> {
    try {
      const searchTerm = `%${query}%`;
      const stmt = this.db.prepare(`
        SELECT * FROM equipment 
        WHERE name LIKE ? OR model LIKE ? OR serial_number LIKE ? OR location LIKE ?
        ORDER BY name
      `);
      const rows = stmt.all(searchTerm, searchTerm, searchTerm, searchTerm) as any[];
      return rows.map(row => this.mapRowToEquipment(row));
    } catch (error) {
      throw new DatabaseError(`Failed to search equipment: ${error}`);
    }
  }

  private mapRowToEquipment(row: any): Equipment {
    return {
      id: row.id,
      name: row.name,
      model: row.model,
      serialNumber: row.serial_number,
      location: row.location,
      purchaseDate: row.purchase_date,
      status: row.status,
      imageUrl: row.image_url,
      notes: row.notes,
      // maintenanceScheduleIds will be populated by joining with maintenance_tasks
      maintenanceScheduleIds: []
    };
  }
}
