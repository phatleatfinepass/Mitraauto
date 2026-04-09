import React, { useState, useEffect } from 'react';
import { getSupabaseConfigError, supabase } from '../../utils/supabase/client';
import { useLanguage } from '../LanguageContext';
import { Button } from '../ui/button';
import { Shield, AlertCircle } from 'lucide-react';

interface CmsGuardProps {
  children: React.ReactNode;
  onNeedLogin: () => void;
}

type AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'not-admin';

export function CmsGuard({ children, onNeedLogin }: CmsGuardProps) {
  const { language } = useLanguage();
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const configError = getSupabaseConfigError();
        if (configError) {
          console.error('Supabase config error:', configError);
          if (isMounted) setAuthState('unauthenticated');
          return;
        }

        // 1. Check if user has a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

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

        // 2. Check if user has admin role in profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

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
        // Re-check admin status when auth state changes
        checkAuth();
      } else {
        if (isMounted) setAuthState('unauthenticated');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
  if (authState === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#11141A] px-4">
        <div className="max-w-md w-full bg-[#1A1D26] rounded-2xl p-8 text-center border border-gray-800">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FF6B35]/10 mb-6">
            <Shield className="w-8 h-8 text-[#FF6B35]" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-3">
            {language === 'fi' ? 'Kirjautuminen vaaditaan' : 'Login Required'}
          </h1>
          
          <p className="text-gray-400 mb-6">
            {language === 'fi' 
              ? 'Sinun täytyy kirjautua sisään päästäksesi CMS-hallintapaneeliin.'
              : 'You need to log in to access the CMS admin panel.'}
          </p>
          
          <Button
            onClick={onNeedLogin}
            className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
          >
            {language === 'fi' ? 'Kirjaudu sisään' : 'Log In'}
          </Button>
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
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            {language === 'fi' ? 'Palaa etusivulle' : 'Return to Home'}
          </Button>
        </div>
      </div>
    );
  }

  // Authenticated as admin - show content
  return <>{children}</>;
}
