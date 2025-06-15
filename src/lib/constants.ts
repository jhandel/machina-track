import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Wrench, Ruler, Package, Bot, Factory, ClipboardList, Settings2 } from 'lucide-react';

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
  }
];

// Sample data for select dropdowns, etc.
export const EQUIPMENT_STATUSES: Equipment['status'][] = ['operational', 'maintenance', 'decommissioned'];
export const METROLOGY_STATUSES: MetrologyTool['status'][] = ['calibrated', 'due_calibration', 'out_of_service', 'awaiting_calibration'];
export const CALIBRATION_RESULTS: CalibrationLog['result'][] = ['pass', 'fail', 'adjusted'];
export const MAINTENANCE_STATUSES: MaintenanceTask['status'][] = ['pending', 'in_progress', 'completed', 'overdue', 'skipped'];

export const MOCK_LOCATIONS = ["Shop Floor A", "Shop Floor B", "Storage Room 1", "Inspection Lab"];
export const MOCK_MANUFACTURERS = ["Haas", "DMG Mori", "Okuma", "Mazak", "Mitutoyo", "Starrett"];
export const MOCK_TOOL_TYPES_METROLOGY = ["Caliper", "Micrometer", "Height Gauge", "Surface Plate", "Gauge Blocks"];
export const MOCK_TOOL_TYPES_CUTTING = ["End Mill", "Drill Bit", "Lathe Insert", "Reamer", "Tap"];
export const MOCK_MATERIALS_CUTTING = ["HSS", "Carbide", "Cobalt", "PCD"];

