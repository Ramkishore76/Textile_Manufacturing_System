export type UserRole =
  | 'ADMIN'
  | 'PRODUCTION'
  | 'SALES'
  | 'STORE'
  | 'QUALITY'
  | 'DISPATCH'
  | 'ACCOUNTS'
  | 'BUYER';

export interface RoleConfig {
  title: string;
  shortRole: string;
  description: string;
  badgeClass: string;
  allowedRoutes: string[];
  primaryAction: {
    label: string;
    to: string;
  };
}

export const ROLE_CONFIGS: Record<string, RoleConfig> = {
  ADMIN: {
    title: 'Plant Owner & Executive Administrator',
    shortRole: 'Administrator',
    description: 'Full plant-wide governance, financial ledger, and manufacturing oversight.',
    badgeClass: 'bg-neutral-100 text-neutral-800 border-neutral-300',
    allowedRoutes: [
      '/app/dashboard',
      '/app/orders',
      '/app/inventory',
      '/app/purchases',
      '/app/production',
      '/app/quality',
      '/app/finished-goods',
      '/app/dispatch',
      '/app/accounts',
      '/app/attendance',
      '/app/wages',
    ],
    primaryAction: {
      label: 'Create New Order',
      to: '/app/orders',
    },
  },
  PRODUCTION: {
    title: 'Production Manager',
    shortRole: 'Production Mgr',
    description: 'Shop-floor loom fleet monitoring, job scheduling, pick logs & roll output.',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200/60',
    allowedRoutes: [
      '/app/dashboard',
      '/app/production',
      '/app/inventory',
      '/app/finished-goods',
      '/app/orders',
    ],
    primaryAction: {
      label: 'Schedule Production Job',
      to: '/app/production',
    },
  },
  SALES: {
    title: 'Sales & Merchandising Executive',
    shortRole: 'Sales Executive',
    description: 'Buyer customer orders, BOM availability checks, and order fulfillment status.',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/60',
    allowedRoutes: [
      '/app/dashboard',
      '/app/orders',
      '/app/finished-goods',
    ],
    primaryAction: {
      label: 'Book New Order',
      to: '/app/orders',
    },
  },
  STORE: {
    title: 'Store & Inventory Manager',
    shortRole: 'Store Manager',
    description: 'Yarn warehouse stocks, minimum threshold shortage alerts, and supplier GRN inwards.',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/60',
    allowedRoutes: [
      '/app/dashboard',
      '/app/inventory',
      '/app/purchases',
      '/app/finished-goods',
      '/app/orders',
    ],
    primaryAction: {
      label: 'Manage Yarn Inventory',
      to: '/app/inventory',
    },
  },
  QUALITY: {
    title: 'Quality Assurance Inspector',
    shortRole: 'Quality Inspector',
    description: '4-Point fabric inspection grading, defect logging, rework routing, and roll release.',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200/60',
    allowedRoutes: [
      '/app/dashboard',
      '/app/quality',
      '/app/finished-goods',
      '/app/production',
    ],
    primaryAction: {
      label: 'Start Fabric Inspection',
      to: '/app/quality',
    },
  },
  DISPATCH: {
    title: 'Logistics & Dispatch Incharge',
    shortRole: 'Dispatch Incharge',
    description: 'Passed roll allocations, packing list verification, transport dispatch & tracking.',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200/60',
    allowedRoutes: [
      '/app/dashboard',
      '/app/dispatch',
      '/app/finished-goods',
      '/app/orders',
    ],
    primaryAction: {
      label: 'Create Dispatch Shipment',
      to: '/app/dispatch',
    },
  },
  ACCOUNTS: {
    title: 'Finance, HR & Accounts Manager',
    shortRole: 'Finance & HR',
    description: 'Commercial invoicing, payment remittances, shift attendance & labour wage payroll.',
    badgeClass: 'bg-stone-100 text-stone-800 border-stone-300',
    allowedRoutes: [
      '/app/dashboard',
      '/app/accounts',
      '/app/attendance',
      '/app/wages',
      '/app/orders',
    ],
    primaryAction: {
      label: 'View Commercial Invoices',
      to: '/app/accounts',
    },
  },
};

export function hasRoleAccess(role: string | undefined | null, routePath: string): boolean {
  if (!role) return false;
  if (role === 'ADMIN') return true;
  const config = ROLE_CONFIGS[role];
  if (!config) return false;
  return config.allowedRoutes.includes(routePath);
}

export function getRoleTitle(role: string | undefined | null): string {
  if (!role) return 'Factory Staff';
  return ROLE_CONFIGS[role]?.title || role;
}

export function getRoleShort(role: string | undefined | null): string {
  if (!role) return 'Staff';
  return ROLE_CONFIGS[role]?.shortRole || role;
}

export function getRolePrimaryAction(role: string | undefined | null) {
  if (!role) return { label: 'Go to Dashboard', to: '/app/dashboard' };
  return ROLE_CONFIGS[role]?.primaryAction || { label: 'Go to Dashboard', to: '/app/dashboard' };
}
