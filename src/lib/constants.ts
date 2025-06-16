import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Wrench, Ruler, Package, Bot, Factory, ClipboardList, Settings2 } from 'lucide-react';
import type { Equipment } from './types';
import type { MetrologyTool } from './types';
import type { CalibrationLog } from './types';
import type { MaintenanceTask } from './types';

export const APP_NAME = "MachinaTrack";
export const APP_DESCRIPTION = "Tool tracking software for machine shops.";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  disabled?: boolean;
  collapsible?: boolean;
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Equipment',
    href: '/equipment',
    icon: Factory, 
  },
  {
    title: 'Metrology',
    href: '/metrology',
    icon: Ruler, 
  },
  {
    title: 'Inventory',
    href: '/inventory',
    icon: Package, 
  },
  {
    title: 'Maintenance',
    href: '/maintenance',
    icon: ClipboardList, 
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings2, 
  }
];

// Sample data for select dropdowns, etc.
export const EQUIPMENT_STATUSES: Equipment['status'][] = ['operational', 'maintenance', 'decommissioned'];
export const METROLOGY_STATUSES: MetrologyTool['status'][] = ['calibrated', 'due_calibration', 'out_of_service', 'awaiting_calibration'];
export const CALIBRATION_RESULTS: CalibrationLog['result'][] = ['pass', 'fail', 'adjusted'];
export const MAINTENANCE_STATUSES: MaintenanceTask['status'][] = ['pending', 'in_progress', 'completed', 'overdue', 'skipped'];

