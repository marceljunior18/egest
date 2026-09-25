// ==============================================================================
// eGest MVP V1 - usePermissions HOOK
// Contrôle d'accès basé sur les rôles (RBAC) : ADMIN | MANAGER | CASHIER | EMPLOYEE
// ==============================================================================

import { UserRole } from '@/types';
import { useOrganization } from './useOrganization';

export function usePermissions() {
  const { currentRole } = useOrganization();

  const isAdmin = currentRole === 'ADMIN';
  const isManager = currentRole === 'MANAGER';
  const isCashier = currentRole === 'CASHIER';
  const isEmployee = currentRole === 'EMPLOYEE';

  return {
    role: currentRole,
    isAdmin,
    isManager,
    isCashier,
    isEmployee,

    // Permissions fines
    canAccessDashboard: true,
    canViewProducts: true,
    canManageProducts: isAdmin || isManager,
    canViewInventory: true,
    canManageInventory: isAdmin || isManager,
    canViewSales: true,
    canCreateSale: isAdmin || isManager || isCashier,
    canViewExpenses: isAdmin || isManager,
    canManageExpenses: isAdmin || isManager,
    canViewEmployees: isAdmin || isManager,
    canManageEmployees: isAdmin,
    canManageSettings: isAdmin,
  };
}
