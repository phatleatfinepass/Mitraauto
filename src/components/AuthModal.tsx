import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { useLanguage } from './LanguageContext';

type AuthView = 'login' | 'signup' | 'reset';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: AuthView;
  onSuccess?: () => void;
}

export function AuthModal({ open, onOpenChange, defaultView = 'login', onSuccess }: AuthModalProps) {
  const { t } = useLanguage();
  const [view, setView] = useState<AuthView>(defaultView);
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '', acceptTerms: false });
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // [AUTH ACTION] /auth/login
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onSuccess?.();
      onOpenChange(false);
    }, 1000);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupData.acceptTerms) return;
    setLoading(true);
    // [AUTH ACTION] /auth/signup
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onSuccess?.();
      onOpenChange(false);
    }, 1000);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // [AUTH ACTION] /auth/reset-password
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setResetSuccess(true);
    }, 1000);
  };

  const handleSocialAuth = (provider: string) => {
    // [AUTH ACTION] /auth/${provider}
    console.log(`Authenticate with ${provider}`);
  };

  React.useEffect(() => {
    setView(defaultView);
    setResetSuccess(false);
  }, [defaultView, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="w-[calc(100%-2rem)] min-w-[320px] max-w-[90vw] sm:max-w-[440px] md:max-w-[480px]">
        {/* Subtle Gradient Blobs Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none rounded-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-blob" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-ring/5 rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/3 rounded-full blur-3xl animate-blob animation-delay-4000" />
        </div>

        {view === 'login' && (
          <>
            <DialogHeader>
              <DialogTitle>{t('auth.login.title')}</DialogTitle>
              <DialogDescription>
                {t('auth.login.subtitle')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2 group">
                <Label htmlFor="login-email" className="transition-all group-hover:text-ring">{t('auth.login.email')}</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder={t('auth.placeholder.email')}
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="transition-all hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:border-ring/50 focus:shadow-[0_0_25px_rgba(0,113,227,0.25)]"
                  required
                />
              </div>
              <div className="space-y-2 group">
                <Label htmlFor="login-password" className="transition-all group-hover:text-ring">{t('auth.login.password')}</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="transition-all hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:border-ring/50 focus:shadow-[0_0_25px_rgba(0,113,227,0.25)]"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('ui.loading') : t('auth.login.submit')}
              </Button>

              <div className="space-y-2">
                <div className="relative flex justify-center text-xs uppercase py-2">
                  <span className="bg-background px-2 text-muted-foreground">{t('auth.or')}</span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSocialAuth('google')}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {t('auth.login.google')}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSocialAuth('apple')}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  {t('auth.login.apple')}
                </Button>
              </div>

              <div className="flex flex-col items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => setView('reset')}
                  className="text-primary hover:underline"
                >
                  {t('auth.login.forgot')}
                </button>
                <div className="text-muted-foreground">
                  {t('auth.login.noAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => setView('signup')}
                    className="text-primary hover:underline"
                  >
                    {t('auth.login.signupLink')}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}

        {view === 'signup' && (
          <>
            <DialogHeader>
              <DialogTitle>{t('auth.signup.title')}</DialogTitle>
              <DialogDescription>
                {t('auth.signup.subtitle')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2 group">
                <Label htmlFor="signup-name" className="transition-all group-hover:text-ring">{t('auth.signup.name')}</Label>
                <Input
                  id="signup-name"
                  type="text"
                  value={signupData.name}
                  onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                  className="transition-all hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:border-ring/50 focus:shadow-[0_0_25px_rgba(0,113,227,0.25)]"
                  required
                />
              </div>
              <div className="space-y-2 group">
                <Label htmlFor="signup-email" className="transition-all group-hover:text-ring">{t('auth.signup.email')}</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder={t('auth.placeholder.email')}
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  className="transition-all hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:border-ring/50 focus:shadow-[0_0_25px_rgba(0,113,227,0.25)]"
                  required
                />
              </div>
              <div className="space-y-2 group">
                <Label htmlFor="signup-password" className="transition-all group-hover:text-ring">{t('auth.signup.password')}</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  className="transition-all hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:border-ring/50 focus:shadow-[0_0_25px_rgba(0,113,227,0.25)]"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="terms"
                  checked={signupData.acceptTerms}
                  onCheckedChange={(checked) => 
                    setSignupData({ ...signupData, acceptTerms: checked === true })
                  }
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground">
                  {t('auth.signup.terms')}{' '}
                  <a href="/legal/terms" className="text-primary hover:underline">
                    {t('auth.signup.termsLink')}
                  </a>
                </label>
              </div>
              <Button type="submit" className="w-full" disabled={loading || !signupData.acceptTerms}>
                {loading ? t('ui.loading') : t('auth.signup.submit')}
              </Button>

              <div className="space-y-2">
                <div className="relative flex justify-center text-xs uppercase py-2">
                  <span className="bg-background px-2 text-muted-foreground">{t('auth.or')}</span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSocialAuth('google')}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {t('auth.login.google')}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSocialAuth('apple')}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  {t('auth.login.apple')}
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                {t('auth.signup.hasAccount')}{' '}
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="text-primary hover:underline"
                >
                  {t('auth.signup.loginLink')}
                </button>
              </div>
            </form>
          </>
        )}

        {view === 'reset' && (
          <>
            <DialogHeader>
              <DialogTitle>{t('auth.reset.title')}</DialogTitle>
              <DialogDescription>
                {t('auth.reset.description')}
              </DialogDescription>
            </DialogHeader>
            {resetSuccess ? (
              <div className="space-y-4 py-4">
                <div className="rounded-lg bg-muted p-4 text-center transition-all hover:shadow-[0_0_25px_rgba(0,113,227,0.1)]">
                  <p className="text-muted-foreground">{t('auth.reset.success')}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setView('login');
                    setResetSuccess(false);
                  }}
                >
                  {t('auth.reset.backToLogin')}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2 group">
                  <Label htmlFor="reset-email" className="transition-all group-hover:text-ring">{t('auth.reset.email')}</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder={t('auth.placeholder.email')}
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="transition-all hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:border-ring/50 focus:shadow-[0_0_25px_rgba(0,113,227,0.25)]"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('ui.loading') : t('auth.reset.submit')}
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="text-sm text-primary hover:underline"
                  >
                    {t('auth.reset.backToLogin')}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
