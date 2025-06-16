import { getPrismaClient } from "../../prisma-client";
import type { DashboardSummary } from '@/lib/types';
import type { DashboardRepository } from '../../interfaces';
import { DatabaseError } from '../../interfaces';


export class PrismaDashboardRepository implements DashboardRepository {
  async getDashboardSummary(): Promise<DashboardSummary> {
      const prisma = await getPrismaClient();
    try {
      const prisma = await getPrismaClient();
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      // Upcoming maintenance count (next 30 days)
      const upcomingMaintenanceCount = await prisma.maintenance_tasks.count({
        where: {
          next_due_date: { lte: futureDateStr, gte: today },
          status: { notIn: ['completed', 'skipped'] },
        },
      });

      // Low inventory count
      const lowInventoryCount = await prisma.consumables.count({
        where: {
          quantity: { lte: prisma.consumables.fields.min_quantity },
        },
      });

      // Overdue calibrations count
      const overdueCalibrationsCount = await prisma.metrology_tools.count({
        where: {
          next_calibration_date: { lt: today },
          status: { not: 'out_of_service' },
        },
      });

      return {
        upcomingMaintenanceCount,
        lowInventoryCount,
        overdueCalibrationsCount,
      };
    } catch (error) {
      throw new DatabaseError(`Failed to get dashboard summary: ${error}`);
    }
  }

  async getRecentActivity(limit: number = 10): Promise<any[]> {
      const prisma = await getPrismaClient();
    try {
      const prisma = await getPrismaClient();
      const activities: any[] = [];
      const perType = Math.ceil(limit / 4);

      // Recent equipment updates
      const equipment = await prisma.equipment.findMany({
        orderBy: { updated_at: 'desc' },
        take: perType,
        select: {
          id: true,
          name: true,
          updated_at: true,
        },
      });
      activities.push(...equipment.map(e => ({
        type: 'equipment',
        id: e.id,
        title: e.name,
        timestamp: e.updated_at,
        description: `Updated equipment: ${e.name}`,
      })));

      // Recent maintenance tasks
      const maintenance = await prisma.maintenance_tasks.findMany({
        orderBy: { updated_at: 'desc' },
        take: perType,
        select: {
          id: true,
          description: true,
          updated_at: true,
        },
      });
      activities.push(...maintenance.map(m => ({
        type: 'maintenance',
        id: m.id,
        title: m.description,
        timestamp: m.updated_at,
        description: `Maintenance task: ${m.description}`,
      })));

      // Recent calibration logs
      const calibration = await prisma.calibration_logs.findMany({
        orderBy: { created_at: 'desc' },
        take: perType,
        include: { metrology_tools: { select: { name: true } } },
      });
      activities.push(...calibration.map(c => ({
        type: 'calibration',
        id: c.id,
        title: c.metrology_tools?.name || '',
        timestamp: c.created_at,
        description: `Calibration completed for: ${c.metrology_tools?.name || ''}`,
      })));

      // Recent service records
      const service = await prisma.service_records.findMany({
        orderBy: { created_at: 'desc' },
        take: perType,
        select: {
          id: true,
          performed_by: true,
          created_at: true,
        },
      });
      activities.push(...service.map(s => ({
        type: 'service',
        id: s.id,
        title: s.performed_by,
        timestamp: s.created_at,
        description: `Service performed by: ${s.performed_by}`,
      })));

      // Sort and limit
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      throw new DatabaseError(`Failed to get recent activity: ${error}`);
    }
  }

  async getEquipmentStatusCounts(): Promise<Record<string, number>> {
    try {
      const prisma = await getPrismaClient();
      const rows = await prisma.equipment.groupBy({
        by: ['status'],
        _count: { status: true },
      });
      const statusCounts: Record<string, number> = {};
      for (const row of rows) {
        statusCounts[row.status] = row._count.status;
      }
      return statusCounts;
    } catch (error) {
      throw new DatabaseError(`Failed to get equipment status counts: ${error}`);
    }
  }

  async getMaintenanceStatusCounts(): Promise<Record<string, number>> {
    try {
      const prisma = await getPrismaClient();
      const rows = await prisma.maintenance_tasks.groupBy({
        by: ['status'],
        _count: { status: true },
      });
      const statusCounts: Record<string, number> = {};
      for (const row of rows) {
        statusCounts[row.status] = row._count.status;
      }
      return statusCounts;
    } catch (error) {
      throw new DatabaseError(`Failed to get maintenance status counts: ${error}`);
    }
  }
}
