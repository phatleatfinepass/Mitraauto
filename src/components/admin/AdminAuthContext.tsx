import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabaseClient } from '../../utils/supabase/client';
import type { User } from '@supabase/supabase-js@2';

interface AdminAuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  needsPasswordChange: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsPasswordChange?: boolean }>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

  const checkAdminStatus = (currentUser: User | null) => {
    if (!currentUser) {
      setIsAdmin(false);
      setNeedsPasswordChange(false);
      return;
    }

    // Check if user is admin (email matches admin@mitra-auto.fi)
    const isAdminUser = currentUser.email === 'admin@mitra-auto.fi';
    setIsAdmin(isAdminUser);

    // Password change is now optional - disabled forced password change
    setNeedsPasswordChange(false);
  };

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Check current session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        checkAdminStatus(session?.user ?? null);
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      checkAdminStatus(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Login failed' };
      }

      // Check if this is admin user
      if (data.user.email !== 'admin@mitra-auto.fi') {
        await supabase.auth.signOut();
        return { success: false, error: 'Unauthorized: Admin access only' };
      }

      setUser(data.user);
      checkAdminStatus(data.user);

      return { 
        success: true, 
        needsPasswordChange: false 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      setNeedsPasswordChange(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const changePassword = async (newPassword: string) => {
    try {
      const supabase = getSupabaseClient();
      
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          needs_password_change: false,
        },
      });

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Refresh user data
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      if (updatedUser) {
        setUser(updatedUser);
        checkAdminStatus(updatedUser);
      }

      return { success: true };
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        needsPasswordChange,
        login,
        logout,
        changePassword,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};
