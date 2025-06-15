import Database from 'better-sqlite3';
import type { DashboardSummary } from '@/lib/types';
import type { DashboardRepository } from '../../interfaces';
import { DatabaseError } from '../../interfaces';

export class SqliteDashboardRepository implements DashboardRepository {
  constructor(private db: Database.Database) {}

  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      // Get upcoming maintenance count (next 30 days)
      const upcomingMaintenanceStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM maintenance_tasks 
        WHERE next_due_date <= ? AND next_due_date >= ?
        AND status NOT IN ('completed', 'skipped')
      `);
      const upcomingMaintenance = upcomingMaintenanceStmt.get(futureDateStr, today) as { count: number };

      // Get low inventory count
      const lowInventoryStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM cutting_tools 
        WHERE quantity <= min_quantity
      `);
      const lowInventory = lowInventoryStmt.get() as { count: number };

      // Get overdue calibrations count
      const overdueCalibrationsStmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM metrology_tools 
        WHERE next_calibration_date < ? 
        AND status != 'out_of_service'
      `);
      const overdueCalibrations = overdueCalibrationsStmt.get(today) as { count: number };

      return {
        upcomingMaintenanceCount: upcomingMaintenance.count,
        lowInventoryCount: lowInventory.count,
        overdueCalibrationsCount: overdueCalibrations.count
      };
    } catch (error) {
      throw new DatabaseError(`Failed to get dashboard summary: ${error}`);
    }
  }

  async getRecentActivity(limit: number = 10): Promise<any[]> {
    try {
      // Get recent activities from multiple tables
      const activities: any[] = [];

      // Recent equipment updates
      const equipmentStmt = this.db.prepare(`
        SELECT 'equipment' as type, id, name as title, updated_at as timestamp, 
               'Updated equipment: ' || name as description
        FROM equipment 
        ORDER BY updated_at DESC 
        LIMIT ?
      `);
      const equipmentActivities = equipmentStmt.all(Math.ceil(limit / 4)) as any[];
      activities.push(...equipmentActivities);

      // Recent maintenance tasks
      const maintenanceStmt = this.db.prepare(`
        SELECT 'maintenance' as type, id, description as title, updated_at as timestamp,
               'Maintenance task: ' || description as description
        FROM maintenance_tasks 
        ORDER BY updated_at DESC 
        LIMIT ?
      `);
      const maintenanceActivities = maintenanceStmt.all(Math.ceil(limit / 4)) as any[];
      activities.push(...maintenanceActivities);

      // Recent calibration logs
      const calibrationStmt = this.db.prepare(`
        SELECT 'calibration' as type, cl.id, mt.name as title, cl.created_at as timestamp,
               'Calibration completed for: ' || mt.name as description
        FROM calibration_logs cl
        JOIN metrology_tools mt ON cl.metrology_tool_id = mt.id
        ORDER BY cl.created_at DESC 
        LIMIT ?
      `);
      const calibrationActivities = calibrationStmt.all(Math.ceil(limit / 4)) as any[];
      activities.push(...calibrationActivities);

      // Recent service records
      const serviceStmt = this.db.prepare(`
        SELECT 'service' as type, id, performed_by as title, created_at as timestamp,
               'Service performed by: ' || performed_by as description
        FROM service_records 
        ORDER BY created_at DESC 
        LIMIT ?
      `);
      const serviceActivities = serviceStmt.all(Math.ceil(limit / 4)) as any[];
      activities.push(...serviceActivities);

      // Sort all activities by timestamp and limit
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      throw new DatabaseError(`Failed to get recent activity: ${error}`);
    }
  }

  async getEquipmentStatusCounts(): Promise<Record<string, number>> {
    try {
      const stmt = this.db.prepare(`
        SELECT status, COUNT(*) as count 
        FROM equipment 
        GROUP BY status
      `);
      const rows = stmt.all() as { status: string; count: number }[];
      
      const statusCounts: Record<string, number> = {};
      for (const row of rows) {
        statusCounts[row.status] = row.count;
      }
      
      return statusCounts;
    } catch (error) {
      throw new DatabaseError(`Failed to get equipment status counts: ${error}`);
    }
  }

  async getMaintenanceStatusCounts(): Promise<Record<string, number>> {
    try {
      const stmt = this.db.prepare(`
        SELECT status, COUNT(*) as count 
        FROM maintenance_tasks 
        GROUP BY status
      `);
      const rows = stmt.all() as { status: string; count: number }[];
      
      const statusCounts: Record<string, number> = {};
      for (const row of rows) {
        statusCounts[row.status] = row.count;
      }
      
      return statusCounts;
    } catch (error) {
      throw new DatabaseError(`Failed to get maintenance status counts: ${error}`);
    }
  }
}
