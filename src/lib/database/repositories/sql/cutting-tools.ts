import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type { CuttingTool } from '@/lib/types';
import type { CuttingToolRepository } from '../../interfaces';
import { DatabaseError, NotFoundError } from '../../interfaces';

export class SqliteCuttingToolRepository implements CuttingToolRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<CuttingTool | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM cutting_tools WHERE id = ?
      `);
      const row = stmt.get(id) as any;
      return row ? this.mapRowToCuttingTool(row) : null;
    } catch (error) {
      throw new DatabaseError(`Failed to find cutting tool by id: ${error}`);
    }
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<CuttingTool[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM cutting_tools 
        ORDER BY updated_at DESC 
        LIMIT ? OFFSET ?
      `);
      const rows = stmt.all(limit, offset) as any[];
      return rows.map(row => this.mapRowToCuttingTool(row));
    } catch (error) {
      throw new DatabaseError(`Failed to find all cutting tools: ${error}`);
    }
  }

  async create(item: Omit<CuttingTool, 'id'>): Promise<CuttingTool> {
    try {
      const id = uuidv4();
      const stmt = this.db.prepare(`
        INSERT INTO cutting_tools (
          id, name, type, material, size, quantity, min_quantity, location,
          tool_life_hours, remaining_tool_life_hours, last_used_date, end_of_life_date,
          supplier, cost_per_unit, image_url, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id,
        item.name,
        item.type,
        item.material || null,
        item.size || null,
        item.quantity,
        item.minQuantity,
        item.location,
        item.toolLifeHours || null,
        item.remainingToolLifeHours || null,
        item.lastUsedDate || null,
        item.endOfLifeDate || null,
        item.supplier || null,
        item.costPerUnit || null,
        item.imageUrl || null,
        item.notes || null
      );

      const created = await this.findById(id);
      if (!created) {
        throw new DatabaseError('Failed to create cutting tool');
      }
      return created;
    } catch (error: any) {
      throw new DatabaseError(`Failed to create cutting tool: ${error.message}`);
    }
  }

  async update(id: string, item: Partial<CuttingTool>): Promise<CuttingTool | null> {
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
      if (item.material !== undefined) {
        fields.push('material = ?');
        values.push(item.material);
      }
      if (item.size !== undefined) {
        fields.push('size = ?');
        values.push(item.size);
      }
      if (item.quantity !== undefined) {
        fields.push('quantity = ?');
        values.push(item.quantity);
      }
      if (item.minQuantity !== undefined) {
        fields.push('min_quantity = ?');
        values.push(item.minQuantity);
      }
      if (item.location !== undefined) {
        fields.push('location = ?');
        values.push(item.location);
      }
      if (item.toolLifeHours !== undefined) {
        fields.push('tool_life_hours = ?');
        values.push(item.toolLifeHours);
      }
      if (item.remainingToolLifeHours !== undefined) {
        fields.push('remaining_tool_life_hours = ?');
        values.push(item.remainingToolLifeHours);
      }
      if (item.lastUsedDate !== undefined) {
        fields.push('last_used_date = ?');
        values.push(item.lastUsedDate);
      }
      if (item.endOfLifeDate !== undefined) {
        fields.push('end_of_life_date = ?');
        values.push(item.endOfLifeDate);
      }
      if (item.supplier !== undefined) {
        fields.push('supplier = ?');
        values.push(item.supplier);
      }
      if (item.costPerUnit !== undefined) {
        fields.push('cost_per_unit = ?');
        values.push(item.costPerUnit);
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
        UPDATE cutting_tools SET ${fields.join(', ')} WHERE id = ?
      `);
      stmt.run(...values);

      return await this.findById(id);
    } catch (error: any) {
      throw new DatabaseError(`Failed to update cutting tool: ${error.message}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare('DELETE FROM cutting_tools WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to delete cutting tool: ${error}`);
    }
  }

  async count(): Promise<number> {
    try {
      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM cutting_tools');
      const result = stmt.get() as { count: number };
      return result.count;
    } catch (error) {
      throw new DatabaseError(`Failed to count cutting tools: ${error}`);
    }
  }

  async findLowInventory(): Promise<CuttingTool[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM cutting_tools 
        WHERE quantity <= min_quantity
        ORDER BY (quantity - min_quantity) ASC, name
      `);
      const rows = stmt.all() as any[];
      return rows.map(row => this.mapRowToCuttingTool(row));
    } catch (error) {
      throw new DatabaseError(`Failed to find low inventory tools: ${error}`);
    }
  }

  async findByLocation(location: string): Promise<CuttingTool[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM cutting_tools WHERE location = ? ORDER BY name
      `);
      const rows = stmt.all(location) as any[];
      return rows.map(row => this.mapRowToCuttingTool(row));
    } catch (error) {
      throw new DatabaseError(`Failed to find cutting tools by location: ${error}`);
    }
  }

  async findByType(type: string): Promise<CuttingTool[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM cutting_tools WHERE type = ? ORDER BY name
      `);
      const rows = stmt.all(type) as any[];
      return rows.map(row => this.mapRowToCuttingTool(row));
    } catch (error) {
      throw new DatabaseError(`Failed to find cutting tools by type: ${error}`);
    }
  }

  async findEndOfLife(date?: string): Promise<CuttingTool[]> {
    try {
      const checkDate = date || new Date().toISOString().split('T')[0];
      const stmt = this.db.prepare(`
        SELECT * FROM cutting_tools 
        WHERE end_of_life_date <= ?
        ORDER BY end_of_life_date ASC
      `);
      const rows = stmt.all(checkDate) as any[];
      return rows.map(row => this.mapRowToCuttingTool(row));
    } catch (error) {
      throw new DatabaseError(`Failed to find end of life tools: ${error}`);
    }
  }

  async search(query: string): Promise<CuttingTool[]> {
    try {
      const searchTerm = `%${query}%`;
      const stmt = this.db.prepare(`
        SELECT * FROM cutting_tools 
        WHERE name LIKE ? OR type LIKE ? OR material LIKE ? OR supplier LIKE ?
        ORDER BY name
      `);
      const rows = stmt.all(searchTerm, searchTerm, searchTerm, searchTerm) as any[];
      return rows.map(row => this.mapRowToCuttingTool(row));
    } catch (error) {
      throw new DatabaseError(`Failed to search cutting tools: ${error}`);
    }
  }

  async updateQuantity(id: string, quantity: number): Promise<CuttingTool | null> {
    try {
      const stmt = this.db.prepare(`
        UPDATE cutting_tools SET quantity = ? WHERE id = ?
      `);
      const result = stmt.run(quantity, id);
      
      if (result.changes === 0) {
        return null;
      }
      
      return await this.findById(id);
    } catch (error) {
      throw new DatabaseError(`Failed to update cutting tool quantity: ${error}`);
    }
  }

  private mapRowToCuttingTool(row: any): CuttingTool {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      material: row.material,
      size: row.size,
      quantity: row.quantity,
      minQuantity: row.min_quantity,
      location: row.location,
      toolLifeHours: row.tool_life_hours,
      remainingToolLifeHours: row.remaining_tool_life_hours,
      lastUsedDate: row.last_used_date,
      endOfLifeDate: row.end_of_life_date,
      supplier: row.supplier,
      costPerUnit: row.cost_per_unit,
      imageUrl: row.image_url,
      notes: row.notes
    };
  }
}
