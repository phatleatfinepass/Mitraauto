import React, { createContext, useContext } from 'react';

export type CmsRole = 'super_admin' | 'admin' | 'supervisor' | 'staff' | 'customer' | 'user' | 'disabled';

export interface CmsAccess {
  userId: string;
  email: string;
  role: CmsRole;
  accountStatus: string;
  isSuperAdmin: boolean;
  canManageAccounts: boolean;
  canManageCustomers: boolean;
}

const CmsAccessContext = createContext<CmsAccess | null>(null);

export function CmsAccessProvider({ access, children }: { access: CmsAccess; children: React.ReactNode }) {
  return (
    <CmsAccessContext.Provider value={access}>
      {children}
    </CmsAccessContext.Provider>
  );
}

export function useCmsAccess() {
  return useContext(CmsAccessContext);
}
