import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type { MaintenanceTask } from '@/lib/types';
import type { MaintenanceTaskRepository } from '../../interfaces';
import { DatabaseError, NotFoundError } from '../../interfaces';

export class SqliteMaintenanceTaskRepository implements MaintenanceTaskRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<MaintenanceTask | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM maintenance_tasks WHERE id = ?
      `);
      const row = stmt.get(id) as any;
      return row ? await this.mapRowToMaintenanceTask(row) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find maintenance task by id: ${error}`);
    }
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<MaintenanceTask[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM maintenance_tasks 
        ORDER BY updated_at DESC 
        LIMIT ? OFFSET ?
      `);
      const rows = stmt.all(limit, offset) as any[];
      const tasks = await Promise.all(rows.map(row => this.mapRowToMaintenanceTask(row)));
      return tasks;
    } catch (error) {
      throw new DatabaseError(`Failed to find all maintenance tasks: ${error}`);
    }
  }

  async create(item: Omit<MaintenanceTask, 'id'>): Promise<MaintenanceTask> {
    try {
      const id = uuidv4();
      
      // Start a transaction for creating task and parts
      const transaction = this.db.transaction(() => {
        // Insert main task
        const stmt = this.db.prepare(`
          INSERT INTO maintenance_tasks (
            id, equipment_id, description, frequency_days, last_performed_date,
            next_due_date, assigned_to, notes, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
          id,
          item.equipmentId,
          item.description,
          item.frequencyDays || null,
          item.lastPerformedDate || null,
          item.nextDueDate || null,
          item.assignedTo || null,
          item.notes || null,
          item.status
        );

        // Insert parts used if provided
        if (item.partsUsed && item.partsUsed.length > 0) {
          const partsStmt = this.db.prepare(`
            INSERT INTO maintenance_parts (id, maintenance_task_id, part_name, quantity)
            VALUES (?, ?, ?, ?)
          `);
          
          for (const part of item.partsUsed) {
            partsStmt.run(uuidv4(), id, part.partName, part.quantity);
          }
        }
      });
      
      transaction();

      const created = await this.findById(id);
      if (!created) {
        throw new DatabaseError('Failed to create maintenance task');
      }
      return created;
    } catch (error: any) {
      throw new DatabaseError(`Failed to create maintenance task: ${error.message}`);
    }
  }

  async update(id: string, item: Partial<MaintenanceTask>): Promise<MaintenanceTask | null> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        return null;
      }

      const transaction = this.db.transaction(() => {
        const fields: string[] = [];
        const values: any[] = [];

        if (item.equipmentId !== undefined) {
          fields.push('equipment_id = ?');
          values.push(item.equipmentId);
        }
        if (item.description !== undefined) {
          fields.push('description = ?');
          values.push(item.description);
        }
        if (item.frequencyDays !== undefined) {
          fields.push('frequency_days = ?');
          values.push(item.frequencyDays);
        }
        if (item.lastPerformedDate !== undefined) {
          fields.push('last_performed_date = ?');
          values.push(item.lastPerformedDate);
        }
        if (item.nextDueDate !== undefined) {
          fields.push('next_due_date = ?');
          values.push(item.nextDueDate);
        }
        if (item.assignedTo !== undefined) {
          fields.push('assigned_to = ?');
          values.push(item.assignedTo);
        }
        if (item.notes !== undefined) {
          fields.push('notes = ?');
          values.push(item.notes);
        }
        if (item.status !== undefined) {
          fields.push('status = ?');
          values.push(item.status);
        }

        if (fields.length > 0) {
          values.push(id);
          const stmt = this.db.prepare(`
            UPDATE maintenance_tasks SET ${fields.join(', ')} WHERE id = ?
          `);
          stmt.run(...values);
        }

        // Update parts if provided
        if (item.partsUsed !== undefined) {
          // Delete existing parts
          const deletePartsStmt = this.db.prepare('DELETE FROM maintenance_parts WHERE maintenance_task_id = ?');
          deletePartsStmt.run(id);
          
          // Insert new parts
          if (item.partsUsed.length > 0) {
            const partsStmt = this.db.prepare(`
              INSERT INTO maintenance_parts (id, maintenance_task_id, part_name, quantity)
              VALUES (?, ?, ?, ?)
            `);
            
            for (const part of item.partsUsed) {
              partsStmt.run(uuidv4(), id, part.partName, part.quantity);
            }
          }
        }
      });

      transaction();
      return await this.findById(id);
    } catch (error: any) {
      throw new DatabaseError(`Failed to update maintenance task: ${error.message}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare('DELETE FROM maintenance_tasks WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to delete maintenance task: ${error}`);
    }
  }

  async count(): Promise<number> {
    try {
      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM maintenance_tasks');
      const result = stmt.get() as { count: number };
      return result.count;
    } catch (error) {
      throw new DatabaseError(`Failed to count maintenance tasks: ${error}`);
    }
  }

  async findByEquipmentId(equipmentId: string): Promise<MaintenanceTask[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM maintenance_tasks 
        WHERE equipment_id = ? 
        ORDER BY next_due_date ASC
      `);
      const rows = stmt.all(equipmentId) as any[];
      const tasks = await Promise.all(rows.map(row => this.mapRowToMaintenanceTask(row)));
      return tasks;
    } catch (error) {
      throw new DatabaseError(`Failed to find maintenance tasks by equipment: ${error}`);
    }
  }

  async findByStatus(status: MaintenanceTask['status']): Promise<MaintenanceTask[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM maintenance_tasks 
        WHERE status = ? 
        ORDER BY next_due_date ASC
      `);
      const rows = stmt.all(status) as any[];
      const tasks = await Promise.all(rows.map(row => this.mapRowToMaintenanceTask(row)));
      return tasks;
    } catch (error) {
      throw new DatabaseError(`Failed to find maintenance tasks by status: ${error}`);
    }
  }

  async findUpcoming(days: number = 30): Promise<MaintenanceTask[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      const stmt = this.db.prepare(`
        SELECT * FROM maintenance_tasks 
        WHERE next_due_date <= ? 
        AND status NOT IN ('completed', 'skipped')
        ORDER BY next_due_date ASC
      `);
      const rows = stmt.all(futureDateStr) as any[];
      const tasks = await Promise.all(rows.map(row => this.mapRowToMaintenanceTask(row)));
      return tasks;
    } catch (error) {
      throw new DatabaseError(`Failed to find upcoming maintenance tasks: ${error}`);
    }
  }

  async findOverdue(date?: string): Promise<MaintenanceTask[]> {
    try {
      const checkDate = date || new Date().toISOString().split('T')[0];
      const stmt = this.db.prepare(`
        SELECT * FROM maintenance_tasks 
        WHERE next_due_date < ? 
        AND status NOT IN ('completed', 'skipped')
        ORDER BY next_due_date ASC
      `);
      const rows = stmt.all(checkDate) as any[];
      const tasks = await Promise.all(rows.map(row => this.mapRowToMaintenanceTask(row)));
      return tasks;
    } catch (error) {
      throw new DatabaseError(`Failed to find overdue maintenance tasks: ${error}`);
    }
  }

  async findByAssignee(assignedTo: string): Promise<MaintenanceTask[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM maintenance_tasks 
        WHERE assigned_to = ? 
        ORDER BY next_due_date ASC
      `);
      const rows = stmt.all(assignedTo) as any[];
      const tasks = await Promise.all(rows.map(row => this.mapRowToMaintenanceTask(row)));
      return tasks;
    } catch (error) {
      throw new DatabaseError(`Failed to find maintenance tasks by assignee: ${error}`);
    }
  }

  async search(query: string): Promise<MaintenanceTask[]> {
    try {
      const searchTerm = `%${query}%`;
      const stmt = this.db.prepare(`
        SELECT * FROM maintenance_tasks 
        WHERE description LIKE ? OR assigned_to LIKE ? OR notes LIKE ?
        ORDER BY next_due_date ASC
      `);
      const rows = stmt.all(searchTerm, searchTerm, searchTerm) as any[];
      const tasks = await Promise.all(rows.map(row => this.mapRowToMaintenanceTask(row)));
      return tasks;
    } catch (error) {
      throw new DatabaseError(`Failed to search maintenance tasks: ${error}`);
    }
  }

  private async mapRowToMaintenanceTask(row: any): Promise<MaintenanceTask> {
    // Get parts used for this task
    const partsStmt = this.db.prepare(`
      SELECT part_name, quantity FROM maintenance_parts WHERE maintenance_task_id = ?
    `);
    const partsRows = partsStmt.all(row.id) as { part_name: string; quantity: number }[];
    const partsUsed = partsRows.map(part => ({
      partName: part.part_name,
      quantity: part.quantity
    }));

    // Get service record IDs for this task
    const serviceStmt = this.db.prepare(`
      SELECT id FROM service_records WHERE maintenance_task_id = ? ORDER BY date DESC
    `);
    const serviceRows = serviceStmt.all(row.id) as { id: string }[];
    const serviceRecordIds = serviceRows.map(service => service.id);

    return {
      id: row.id,
      equipmentId: row.equipment_id,
      description: row.description,
      frequencyDays: row.frequency_days,
      lastPerformedDate: row.last_performed_date,
      nextDueDate: row.next_due_date,
      assignedTo: row.assigned_to,
      notes: row.notes,
      status: row.status,
      partsUsed: partsUsed.length > 0 ? partsUsed : undefined,
      serviceRecordIds: serviceRecordIds.length > 0 ? serviceRecordIds : undefined
    };
  }
}
