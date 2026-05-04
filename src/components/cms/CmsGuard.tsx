import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getSupabaseConfigError, supabase } from '../../utils/supabase/client';
import { useLanguage } from '../LanguageContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Shield, AlertCircle } from 'lucide-react';
import { CmsAccessProvider, type CmsAccess, type CmsRole } from './CmsAccessContext';

const TIRES_CMS_STATE_KEY = 'mitra.tires-cms.state.v3';
const TIRES_CMS_CACHE_KEY = 'mitra.tires-cms.cache.v3';

function clearCmsSessionCaches() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(TIRES_CMS_STATE_KEY);
  window.sessionStorage.removeItem(TIRES_CMS_CACHE_KEY);
}

interface CmsGuardProps {
  children: React.ReactNode;
  onNeedLogin: () => void;
  requiredModule?: 'rescue' | 'schedule' | 'catalog_tires' | 'catalog_rims' | 'orders' | 'invoices' | 'customers' | 'accounts';
}

type AuthState = 'loading' | 'verifying' | 'authenticated' | 'unauthenticated' | 'not-admin';

function normalizeCmsAccessRow(accessRows: unknown, fallbackUser: { id: string; email?: string | null }): CmsAccess | null {
  const row = Array.isArray(accessRows) ? accessRows[0] : accessRows && typeof accessRows === 'object' ? accessRows as any : null;
  if (!row) return null;

  return {
    userId: String(row.user_id ?? fallbackUser.id),
    email: String(row.email ?? fallbackUser.email ?? ''),
    role: (row.role ?? 'user') as CmsRole,
    accountStatus: String(row.account_status ?? 'active'),
    isSuperAdmin: Boolean(row.is_super_admin),
    canManageAccounts: Boolean(row.can_manage_accounts),
    canManageCustomers: Boolean(row.can_manage_customers),
  };
}

function canOpenRequiredModule(access: CmsAccess | null, requiredModule: CmsGuardProps['requiredModule']) {
  if (!access || access.accountStatus !== 'active') return false;
  if (access.isSuperAdmin) return true;
  if (!requiredModule) {
    return access.canManageAccounts || access.canManageCustomers || access.role === 'admin';
  }
  if (requiredModule === 'accounts') return access.canManageAccounts;
  if (requiredModule === 'customers') return access.canManageCustomers;
  return access.role === 'admin';
}

export function CmsGuard({ children, onNeedLogin, requiredModule }: CmsGuardProps) {
  const { language } = useLanguage();
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [userEmail, setUserEmail] = useState<string>('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [access, setAccess] = useState<CmsAccess | null>(null);
  const verificationIdRef = useRef(0);

  const beginVerification = useCallback(() => {
    setAuthState((current) => {
      if (current === 'authenticated') {
        return current;
      }

      return current === 'unauthenticated' ? 'verifying' : 'loading';
    });
  }, []);

  const withTimeout = useCallback(async <T,>(promise: Promise<T>, timeoutMs = 10000): Promise<T> => {
    let timeoutId: number | undefined;

    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timeoutId = window.setTimeout(() => reject(new Error('CMS auth check timed out.')), timeoutMs);
        }),
      ]);
    } finally {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    }
  }, []);

  const verifyAccess = useCallback(async (mode: 'initial' | 'auth-change' | 'inline-login' = 'initial') => {
    const verificationId = verificationIdRef.current + 1;
    verificationIdRef.current = verificationId;
    const isCurrent = () => verificationIdRef.current === verificationId;

    if (mode !== 'initial') beginVerification();

    try {
      const configError = getSupabaseConfigError();
      if (configError) {
        console.error('Supabase config error:', configError);
        if (isCurrent()) {
          setAccess(null);
          setAuthState('unauthenticated');
        }
        return;
      }

      const { data: { session }, error: sessionError } = await withTimeout(supabase.auth.getSession());

      if (!isCurrent()) return;

      if (sessionError) {
        console.error('Session error:', sessionError);
        setAccess(null);
        setAuthState('unauthenticated');
        return;
      }

      if (!session?.user) {
        setAccess(null);
        setUserEmail('');
        setAuthState('unauthenticated');
        return;
      }

      setUserEmail(session.user.email || '');

      const { data: accessRows, error: accessError } = await withTimeout(
        supabase.rpc('cms_get_current_access'),
      );

      if (!isCurrent()) return;

      if (accessError) {
        console.error('CMS access fetch error:', accessError);
        setAccess(null);
        setAuthState('not-admin');
        return;
      }

      const nextAccess = normalizeCmsAccessRow(accessRows, session.user);
      if (canOpenRequiredModule(nextAccess, requiredModule)) {
        setAccess(nextAccess);
        setAuthState('authenticated');
      } else {
        setAccess(null);
        setAuthState('not-admin');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      if (isCurrent()) {
        setAccess(null);
        setAuthState('unauthenticated');
      }
    }
  }, [beginVerification, requiredModule, withTimeout]);

  useEffect(() => {
    void verifyAccess('initial');

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        clearCmsSessionCaches();
        if (event !== 'INITIAL_SESSION') void verifyAccess('auth-change');
      } else {
        verificationIdRef.current += 1;
        clearCmsSessionCaches();
        setAccess(null);
        setUserEmail('');
        setAuthState('unauthenticated');
      }
    });

    return () => {
      verificationIdRef.current += 1;
      subscription.unsubscribe();
    };
  }, [verifyAccess]);

  const handleInlineLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loggingIn) return;

    setLoggingIn(true);
    setLoginError('');

    try {
      const configError = getSupabaseConfigError();
      if (configError) {
        setLoginError(configError);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        setLoginError(error.message || (language === 'fi' ? 'Kirjautuminen epäonnistui' : 'Login failed'));
        return;
      }

      if (data.user) {
        try {
          await supabase.rpc('account_profile_bootstrap');
        } catch {
          // Non-blocking.
        }
        void verifyAccess('inline-login');
      }
    } catch (error) {
      console.error('CMS inline login error:', error);
      setLoginError(language === 'fi' ? 'Kirjautuminen epäonnistui' : 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('CMS guard sign out failed:', error);
    } finally {
      clearCmsSessionCaches();
      setAuthState('unauthenticated');
      setUserEmail('');
      setAccess(null);
    }
  };

  // Show loading spinner while checking
  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#11141A]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35]" />
          <p className="text-sm text-gray-400">
            {language === 'fi' ? 'Tarkistetaan käyttöoikeuksia...' : 'Checking permissions...'}
          </p>
        </div>
      </div>
    );
  }

  // User not logged in - trigger login modal
  if (authState === 'unauthenticated' || authState === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#11141A] px-4">
        <div className="max-w-md w-full bg-[#1A1D26] rounded-2xl p-8 border border-gray-800">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FF6B35]/10 mb-6">
            <Shield className="w-8 h-8 text-[#FF6B35]" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-3 text-center">
            {language === 'fi' ? 'Kirjautuminen vaaditaan' : 'Login Required'}
          </h1>
          
          <p className="text-gray-400 mb-6 text-center">
            {authState === 'verifying'
              ? (language === 'fi'
                  ? 'Vahvistetaan käyttöoikeuksiasi...'
                  : 'Verifying your access...')
              : (language === 'fi'
                  ? 'Sinun täytyy kirjautua sisään päästäksesi CMS-hallintapaneeliin.'
                  : 'You need to log in to access the CMS admin panel.')}
          </p>

          <form onSubmit={handleInlineLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cms-login-email" className="text-gray-300">
                {language === 'fi' ? 'Sähköposti' : 'Email'}
              </Label>
              <Input
                id="cms-login-email"
                type="email"
                autoComplete="username"
                value={loginEmail}
                onChange={(event) => {
                  setLoginEmail(event.target.value);
                  if (loginError) setLoginError('');
                }}
                className="border-gray-700 bg-[#0D1016] text-white"
                disabled={authState === 'verifying'}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cms-login-password" className="text-gray-300">
                {language === 'fi' ? 'Salasana' : 'Password'}
              </Label>
              <Input
                id="cms-login-password"
                type="password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(event) => {
                  setLoginPassword(event.target.value);
                  if (loginError) setLoginError('');
                }}
                className="border-gray-700 bg-[#0D1016] text-white"
                disabled={authState === 'verifying'}
                required
              />
            </div>

            {loginError ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {loginError}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={loggingIn || authState === 'verifying'}
              className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
            >
              {authState === 'verifying'
                ? (language === 'fi' ? 'Vahvistetaan...' : 'Verifying...')
                : loggingIn
                ? (language === 'fi' ? 'Kirjaudutaan...' : 'Signing in...')
                : (language === 'fi' ? 'Kirjaudu sisään' : 'Log In')}
            </Button>
          </form>

          <button
            type="button"
            onClick={onNeedLogin}
            disabled={authState === 'verifying'}
            className="mt-4 w-full text-sm text-gray-400 hover:text-white transition-colors"
          >
            {language === 'fi' ? 'Avaa tavallinen kirjautumisikkuna' : 'Open standard login modal'}
          </button>
        </div>
      </div>
    );
  }

  // User logged in but not admin
  if (authState === 'not-admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#11141A] px-4">
        <div className="max-w-md w-full bg-[#1A1D26] rounded-2xl p-8 text-center border border-gray-800">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-3">
            {language === 'fi' ? 'Ei käyttöoikeutta' : 'Access Denied'}
          </h1>
          
          <p className="text-gray-400 mb-2">
            {language === 'fi' 
              ? 'Sinulla ei ole oikeutta käyttää CMS-hallintapaneelia.'
              : 'You do not have permission to access the CMS admin panel.'}
          </p>
          
          {userEmail && (
            <p className="text-sm text-gray-500 mb-6">
              {language === 'fi' ? 'Kirjautuneena:' : 'Logged in as:'} {userEmail}
            </p>
          )}
          
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            {language === 'fi' ? 'Kirjaudu ulos' : 'Sign out'}
          </Button>
        </div>
      </div>
    );
  }

  // Authenticated as admin - show content
  if (!access) {
    return null;
  }

  return <CmsAccessProvider access={access}>{children}</CmsAccessProvider>;
}
