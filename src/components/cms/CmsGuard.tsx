import React, { useState, useEffect } from 'react';
import { getSupabaseConfigError, supabase } from '../../utils/supabase/client';
import { useLanguage } from '../LanguageContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Shield, AlertCircle } from 'lucide-react';

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
}

type AuthState = 'loading' | 'verifying' | 'authenticated' | 'unauthenticated' | 'not-admin';

export function CmsGuard({ children, onNeedLogin }: CmsGuardProps) {
  const { language } = useLanguage();
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [userEmail, setUserEmail] = useState<string>('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const beginVerification = () => {
    setAuthState((current) => {
      if (current === 'authenticated') {
        return current;
      }

      return current === 'unauthenticated' ? 'verifying' : 'loading';
    });
  };

  useEffect(() => {
    let isMounted = true;

    const withTimeout = async <T,>(promise: Promise<T>, timeoutMs = 10000): Promise<T> => {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          window.setTimeout(() => reject(new Error('CMS auth check timed out.')), timeoutMs);
        }),
      ]);
    };

    const checkAuth = async () => {
      try {
        const configError = getSupabaseConfigError();
        if (configError) {
          console.error('Supabase config error:', configError);
          if (isMounted) setAuthState('unauthenticated');
          return;
        }

        const { data: { session }, error: sessionError } = await withTimeout(supabase.auth.getSession());

        if (sessionError) {
          console.error('Session error:', sessionError);
          if (isMounted) setAuthState('unauthenticated');
          return;
        }

        if (!session?.user) {
          if (isMounted) setAuthState('unauthenticated');
          return;
        }

        // Store user email for display
        if (isMounted) {
          setUserEmail(session.user.email || '');
        }

        const { data: profile, error: profileError } = await withTimeout(
          supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle(),
        );

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          // Profile might not exist yet, treat as not-admin
          if (isMounted) setAuthState('not-admin');
          return;
        }

        if (profile?.role === 'admin') {
          if (isMounted) setAuthState('authenticated');
        } else {
          if (isMounted) setAuthState('not-admin');
        }

      } catch (error) {
        console.error('Auth check error:', error);
        if (isMounted) setAuthState('unauthenticated');
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        clearCmsSessionCaches();
        if (isMounted) beginVerification();
        checkAuth();
      } else {
        clearCmsSessionCaches();
        if (isMounted) setAuthState('unauthenticated');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
        beginVerification();
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
  return <>{children}</>;
}
