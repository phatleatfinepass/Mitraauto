import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getSupabaseConfigError, supabase } from '../../../utils/supabase/client';
import { useLanguage } from '../../../i18n/LanguageContext';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Shield, AlertCircle } from 'lucide-react';
import { CmsAccessProvider, type CmsAccess, type CmsRole } from './CmsAccessContext';
import { requestCmsAccountRecovery } from '../account-customer/api';

const TIRES_CMS_STATE_KEY = 'mitra.tires-cms.state.v3';
const TIRES_CMS_CACHE_KEY = 'mitra.tires-cms.cache.v3';
const CMS_PASSWORD_SETUP_PARAMS_KEY = 'mitra.cms.password-setup.params.v1';

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

type AuthState =
  | 'loading'
  | 'verifying'
  | 'authenticated'
  | 'unauthenticated'
  | 'not-admin'
  | 'password-recovery'
  | 'mfa-enroll'
  | 'mfa-challenge';

type MfaScreenMode = Extract<AuthState, 'mfa-enroll' | 'mfa-challenge'>;

function getPasswordRecoveryState() {
  if (typeof window === 'undefined') return { active: false, expired: false, message: '', hasToken: false };
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
  const isPasswordSetupPath = url.pathname.replace(/\/+$/, '') === '/cms/password-setup';
  const linkType = url.searchParams.get('type') || hash.get('type') || '';
  const isSetupLink = ['recovery', 'invite', 'signup', 'magiclink'].includes(linkType);
  const hasToken =
    hash.has('access_token') ||
    hash.has('refresh_token') ||
    hash.has('token') ||
    url.searchParams.has('code') ||
    url.searchParams.has('token') ||
    url.searchParams.has('token_hash') ||
    hash.has('token_hash');
  const hasRecoveryError = hash.has('error') || hash.has('error_code') || url.searchParams.has('error') || url.searchParams.has('error_code');
  const errorCode = hash.get('error_code') || url.searchParams.get('error_code') || '';
  const errorDescription = hash.get('error_description') || url.searchParams.get('error_description') || '';

  if (hasRecoveryError) {
    return {
      active: isPasswordSetupPath || isSetupLink,
      expired: errorCode === 'otp_expired',
      message: errorDescription || 'The password setup link could not be used.',
      hasToken: false,
    };
  }

  if (isPasswordSetupPath || isSetupLink || hasToken) {
    return {
      active: true,
      expired: false,
      message: '',
      hasToken,
    };
  }

  return { active: false, expired: false, message: '', hasToken: false };
}

function getPasswordSetupUrlParams() {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
  const read = (key: string) => hash.get(key) || url.searchParams.get(key) || '';
  const accessToken = read('access_token');
  const refreshToken = read('refresh_token');
  const expiresIn = read('expires_in');
  const tokenType = read('token_type');
  const code = read('code');
  const tokenHash = read('token_hash');
  const type = read('type') || 'recovery';

  const params = {
    accessToken,
    refreshToken,
    expiresIn,
    tokenType,
    code,
    tokenHash,
    type,
    hasImplicitSession: Boolean(accessToken && refreshToken && expiresIn && tokenType),
  };

  if (params.hasImplicitSession || params.code || params.tokenHash) {
    window.sessionStorage.setItem(CMS_PASSWORD_SETUP_PARAMS_KEY, JSON.stringify({
      accessToken,
      refreshToken,
      expiresIn,
      tokenType,
      code,
      tokenHash,
      type,
      savedAt: Date.now(),
    }));
    return params;
  }

  const saved = window.sessionStorage.getItem(CMS_PASSWORD_SETUP_PARAMS_KEY);
  if (!saved) return params;

  try {
    const parsed = JSON.parse(saved);
    if (!parsed?.savedAt || Date.now() - Number(parsed.savedAt) > 1000 * 60 * 30) {
      window.sessionStorage.removeItem(CMS_PASSWORD_SETUP_PARAMS_KEY);
      return params;
    }

    const savedAccessToken = String(parsed.accessToken ?? '');
    const savedRefreshToken = String(parsed.refreshToken ?? '');
    const savedExpiresIn = String(parsed.expiresIn ?? '');
    const savedTokenType = String(parsed.tokenType ?? '');
    return {
      accessToken: savedAccessToken,
      refreshToken: savedRefreshToken,
      expiresIn: savedExpiresIn,
      tokenType: savedTokenType,
      code: String(parsed.code ?? ''),
      tokenHash: String(parsed.tokenHash ?? ''),
      type: String(parsed.type ?? 'recovery') || 'recovery',
      hasImplicitSession: Boolean(savedAccessToken && savedRefreshToken && savedExpiresIn && savedTokenType),
    };
  } catch {
    window.sessionStorage.removeItem(CMS_PASSWORD_SETUP_PARAMS_KEY);
    return params;
  }
}

function normalizeCmsAccessRow(accessRows: unknown, fallbackUser: { id: string; email?: string | null }): CmsAccess | null {
  const row = Array.isArray(accessRows) ? accessRows[0] : accessRows && typeof accessRows === 'object' ? accessRows as any : null;
  if (!row) return null;
  const permissions = row.cms_permissions && typeof row.cms_permissions === 'object' ? row.cms_permissions as Record<string, string> : {};

  return {
    userId: String(row.user_id ?? fallbackUser.id),
    email: String(row.email ?? fallbackUser.email ?? ''),
    role: (row.role ?? 'user') as CmsRole,
    accountStatus: String(row.account_status ?? 'active'),
    isSuperAdmin: Boolean(row.is_super_admin),
    canManageAccounts: Boolean(row.can_manage_accounts),
    canManageCustomers: Boolean(row.can_manage_customers),
    permissions,
  };
}

function hasCmsModulePermission(access: CmsAccess, module: string, action: 'read' | 'write' = 'read') {
  if (access.isSuperAdmin) return true;
  const permission = access.permissions?.[module];
  if (action === 'read') return permission === 'read' || permission === 'read_write';
  return permission === 'read_write';
}

function canOpenRequiredModule(access: CmsAccess | null, requiredModule: CmsGuardProps['requiredModule']) {
  if (!access || access.accountStatus !== 'active') return false;
  if (access.isSuperAdmin) return true;
  if (!requiredModule) {
    return Object.values(access.permissions ?? {}).some((permission) => permission === 'read' || permission === 'read_write');
  }
  return hasCmsModulePermission(access, requiredModule, 'read');
}

export function CmsGuard({ children, onNeedLogin, requiredModule }: CmsGuardProps) {
  const { t } = useLanguage();
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [userEmail, setUserEmail] = useState<string>('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetSending, setResetSending] = useState(false);
  const [recoveryLinkError, setRecoveryLinkError] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryConfirm, setRecoveryConfirm] = useState('');
  const [recoverySaving, setRecoverySaving] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [mfaQrCode, setMfaQrCode] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaSaving, setMfaSaving] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [access, setAccess] = useState<CmsAccess | null>(null);
  const verificationIdRef = useRef(0);
  const mfaFlowActiveRef = useRef(false);

  const beginVerification = useCallback(() => {
    setAuthState((current) => {
      if (current === 'authenticated' || current === 'password-recovery' || current === 'mfa-enroll' || current === 'mfa-challenge') {
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

  const resetMfaPrompt = useCallback(() => {
    mfaFlowActiveRef.current = false;
    setMfaCode('');
    setMfaFactorId('');
    setMfaQrCode('');
    setMfaSecret('');
    setMfaError('');
  }, []);

  const requireCmsMfa = useCallback(async (nextAccess: CmsAccess): Promise<boolean> => {
    const { data: hasVerifiedMfa, error: aalError } = await withTimeout(
      supabase.rpc('cms_has_verified_mfa'),
    );

    if (aalError) {
      console.error('CMS MFA AAL check failed:', aalError);
      throw aalError;
    }

    if (hasVerifiedMfa === true) {
      resetMfaPrompt();
      return false;
    }

    setAccess(nextAccess);

    const { data: factors, error: factorsError } = await withTimeout(
      supabase.auth.mfa.listFactors(),
    );

    if (factorsError) {
      console.error('CMS MFA factors fetch failed:', factorsError);
      throw factorsError;
    }

    const totpFactors = factors?.totp ?? [];
    const verifiedTotp = totpFactors.find((factor) => factor.status === 'verified');
    if (verifiedTotp?.id) {
      mfaFlowActiveRef.current = true;
      setMfaFactorId(verifiedTotp.id);
      setMfaQrCode('');
      setMfaSecret('');
      setMfaCode('');
      setMfaError('');
      setAuthState('mfa-challenge');
      return true;
    }

    const pendingTotp = totpFactors.filter((factor) => factor.status !== 'verified');
    for (const factor of pendingTotp) {
      try {
        await withTimeout(supabase.auth.mfa.unenroll({ factorId: factor.id }), 10000);
      } catch (error) {
        console.warn('CMS pending MFA factor cleanup failed:', error);
      }
    }

    const { data: enrollment, error: enrollmentError } = await withTimeout(
      supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Mitra Auto CMS',
        issuer: 'Mitra Auto CMS',
      }),
    );

    if (enrollmentError) {
      console.error('CMS MFA enrollment failed:', enrollmentError);
      throw enrollmentError;
    }

    mfaFlowActiveRef.current = true;
    setMfaFactorId(enrollment.id);
    setMfaQrCode(enrollment.totp.qr_code);
    setMfaSecret(enrollment.totp.secret);
    setMfaCode('');
    setMfaError('');
    setAuthState('mfa-enroll');
    return true;
  }, [resetMfaPrompt, withTimeout]);

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
        const mfaRequired = await requireCmsMfa(nextAccess);
        if (mfaRequired || !isCurrent()) return;

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
  }, [beginVerification, requiredModule, requireCmsMfa, withTimeout]);

  const settleVerifiedMfaSession = useCallback(async () => {
    const verificationId = verificationIdRef.current + 1;
    verificationIdRef.current = verificationId;
    const isCurrent = () => verificationIdRef.current === verificationId;

    beginVerification();

    try {
      const { data: { session }, error: sessionError } = await withTimeout(supabase.auth.getSession());
      if (!isCurrent()) return;

      if (sessionError || !session?.user) {
        if (sessionError) console.error('Session error after MFA verification:', sessionError);
        setAccess(null);
        setAuthState('unauthenticated');
        return;
      }

      setUserEmail(session.user.email || '');

      const { data: hasVerifiedMfa, error: aalError } = await withTimeout(
        supabase.rpc('cms_has_verified_mfa'),
      );
      if (!isCurrent()) return;

      if (aalError) {
        console.error('CMS MFA AAL check after verification failed:', aalError);
        setAccess(null);
        setAuthState('unauthenticated');
        return;
      }

      if (hasVerifiedMfa !== true) {
        mfaFlowActiveRef.current = true;
        setAuthState('mfa-challenge');
        return;
      }

      const { data: accessRows, error: accessError } = await withTimeout(
        supabase.rpc('cms_get_current_access'),
      );
      if (!isCurrent()) return;

      if (accessError) {
        console.error('CMS access fetch after MFA verification failed:', accessError);
        setAccess(null);
        setAuthState('not-admin');
        return;
      }

      const nextAccess = normalizeCmsAccessRow(accessRows, session.user);
      if (canOpenRequiredModule(nextAccess, requiredModule)) {
        resetMfaPrompt();
        setAccess(nextAccess);
        setAuthState('authenticated');
      } else {
        setAccess(null);
        setAuthState('not-admin');
      }
    } catch (error) {
      console.error('CMS MFA session settle failed:', error);
      if (isCurrent()) {
        setAccess(null);
        setAuthState('unauthenticated');
      }
    }
  }, [beginVerification, requiredModule, resetMfaPrompt, withTimeout]);

  const handleSendPasswordReset = async () => {
    if (resetSending) return;
    const email = (loginEmail || userEmail).trim();
    if (!email) {
      setLoginError(t('cmsGuard.enterEmailFirst'));
      return;
    }

    setResetSending(true);
    setLoginError('');
    setResetMessage('');

    try {
      await requestCmsAccountRecovery(email);
      setResetMessage(t('cmsGuard.passwordResetSent'));
    } catch (error) {
      console.error('CMS password reset request failed:', error);
      setLoginError(t('cmsGuard.passwordResetFailed'));
    } finally {
      setResetSending(false);
    }
  };

  const ensurePasswordSetupSession = async () => {
    const { data: currentSession } = await supabase.auth.getSession();
    if (currentSession.session?.user) return true;

    const setupParams = getPasswordSetupUrlParams();
    if (!setupParams) return false;

    if (setupParams.hasImplicitSession) {
      const { data, error } = await supabase.auth.setSession({
        access_token: setupParams.accessToken,
        refresh_token: setupParams.refreshToken,
      });
      if (error) throw error;
      return Boolean(data.session?.user);
    }

    if (setupParams.code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(setupParams.code);
      if (error) throw error;
      return Boolean(data.session?.user);
    }

    if (setupParams.tokenHash) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: setupParams.tokenHash,
        type: setupParams.type === 'invite' ? 'invite' : 'recovery',
      });
      if (error) throw error;
      return Boolean(data.session?.user);
    }

    return false;
  };

  const handleUpdateRecoveredPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (recoverySaving) return;
    setLoginError('');
    setResetMessage('');

    if (recoveryPassword.length < 8) {
      setLoginError(t('cmsGuard.passwordTooShort'));
      return;
    }

    if (recoveryPassword !== recoveryConfirm) {
      setLoginError(t('cmsGuard.passwordMismatch'));
      return;
    }

    setRecoverySaving(true);

    try {
      const hasSetupSession = await ensurePasswordSetupSession();
      if (!hasSetupSession) {
        setLoginError(t('cmsGuard.passwordSetupSessionMissing'));
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: recoveryPassword });
      if (error) {
        const message = /session/i.test(error.message)
          ? t('cmsGuard.passwordSetupSessionMissing')
          : error.message;
        setLoginError(message);
        return;
      }
      setRecoveryPassword('');
      setRecoveryConfirm('');
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(CMS_PASSWORD_SETUP_PARAMS_KEY);
      }
      setResetMessage(t('cmsGuard.passwordChanged'));
      if (typeof window !== 'undefined' && window.location.pathname.replace(/\/+$/, '') === '/cms/password-setup') {
        window.history.replaceState(window.history.state, '', '/cms');
      }
      void verifyAccess('inline-login');
    } catch (error) {
      console.error('CMS password update failed:', error);
      setLoginError(t('cmsGuard.passwordChangeFailed'));
    } finally {
      setRecoverySaving(false);
    }
  };

  const handleVerifyMfa = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mfaSaving) return;

    const code = mfaCode.trim().replace(/\s/g, '');
    if (!mfaFactorId) {
      setMfaError(t('cmsGuard.mfaFactorMissing'));
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setMfaError(t('cmsGuard.mfaCodeInvalid'));
      return;
    }

    setMfaSaving(true);
    setMfaError('');

    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: mfaFactorId,
        code,
      });

      if (error) {
        setMfaError(error.message);
        return;
      }

      setMfaCode('');
      await settleVerifiedMfaSession();
    } catch (error) {
      console.error('CMS MFA verification failed:', error);
      setMfaError(t('cmsGuard.mfaVerificationFailed'));
    } finally {
      setMfaSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('CMS guard sign out failed:', error);
    } finally {
      verificationIdRef.current += 1;
      mfaFlowActiveRef.current = false;
      clearCmsSessionCaches();
      resetMfaPrompt();
      setAuthState('unauthenticated');
      setUserEmail('');
      setAccess(null);
    }
  };

  const renderMfaScreen = (mode: MfaScreenMode) => {
    const isEnrollment = mode === 'mfa-enroll';

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#11141A] px-4">
        <div className="max-w-md w-full bg-[#1A1D26] rounded-2xl p-8 border border-gray-800">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FF6B35]/10 mb-6">
            <Shield className="w-8 h-8 text-[#FF6B35]" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-3 text-center">
            {isEnrollment
              ? t('cmsGuard.setUp2fa')
              : t('cmsGuard.verify2fa')}
          </h1>

          <p className="text-gray-400 mb-6 text-center">
            {isEnrollment
              ? t('cmsGuard.setUp2faDescription')
              : t('cmsGuard.verify2faDescription')}
          </p>

          {isEnrollment ? (
            <div className="mb-6 space-y-4">
              {mfaQrCode ? (
                <div className="rounded-xl border border-gray-700 bg-white p-4">
                  <img src={mfaQrCode} alt="CMS 2FA QR code" className="mx-auto h-48 w-48" />
                </div>
              ) : null}
              {mfaSecret ? (
                <div className="rounded-xl border border-gray-700 bg-[#0D1016] px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                    {t('cmsGuard.manualKey')}
                  </p>
                  <p className="break-all font-mono text-sm text-gray-200">{mfaSecret}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {mfaError ? (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {mfaError}
            </div>
          ) : null}

          {mfaFactorId ? (
            <form onSubmit={handleVerifyMfa} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cms-mfa-code" className="text-gray-300">
                {t('cmsGuard.sixDigitCode')}
              </Label>
              <Input
                id="cms-mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={mfaCode}
                onChange={(event) => {
                  setMfaCode(event.target.value);
                  if (mfaError) setMfaError('');
                }}
                className="border-gray-700 bg-[#0D1016] text-white"
                maxLength={8}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={mfaSaving}
              className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
            >
              {mfaSaving
                ? t('cmsGuard.verifying')
                : isEnrollment
                ? t('cmsGuard.enable2fa')
                : t('cmsGuard.verifyAndContinue')}
            </Button>
            </form>
          ) : null}

          <button
            type="button"
            onClick={handleSignOut}
            disabled={mfaSaving}
            className="mt-4 w-full text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t('cmsGuard.signOut')}
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const applyPasswordRecoveryState = (recoveryState = getPasswordRecoveryState()) => {
      if (!recoveryState.active) return false;

      if (recoveryState.expired) {
        setRecoveryLinkError(t('cmsGuard.recoveryLinkExpired'));
      } else if (recoveryState.message) {
        setRecoveryLinkError(recoveryState.message.startsWith('Open the newest')
          ? t('cmsGuard.openNewestSetupLink')
          : recoveryState.message);
      } else {
        setRecoveryLinkError('');
      }

      setAuthState('password-recovery');
      return true;
    };

    const recoveryState = getPasswordRecoveryState();
    if (!applyPasswordRecoveryState(recoveryState)) {
      void verifyAccess('initial');
    }

    const handleRecoveryUrlChange = () => {
      void applyPasswordRecoveryState();
    };

    window.addEventListener('hashchange', handleRecoveryUrlChange);
    window.addEventListener('popstate', handleRecoveryUrlChange);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (applyPasswordRecoveryState()) {
        return;
      }

      if (event === 'PASSWORD_RECOVERY') {
        clearCmsSessionCaches();
        setRecoveryLinkError('');
        setAuthState('password-recovery');
        return;
      }

      if (mfaFlowActiveRef.current) {
        return;
      }

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
      window.removeEventListener('hashchange', handleRecoveryUrlChange);
      window.removeEventListener('popstate', handleRecoveryUrlChange);
      subscription.unsubscribe();
    };
  }, [t, verifyAccess]);

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
        setLoginError(error.message || t('cmsGuard.loginFailed'));
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
      setLoginError(t('cmsGuard.loginFailed'));
    } finally {
      setLoggingIn(false);
    }
  };

  if (authState === 'password-recovery') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#11141A] px-4">
        <div className="max-w-md w-full bg-[#1A1D26] rounded-2xl p-8 border border-gray-800">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FF6B35]/10 mb-6">
            <Shield className="w-8 h-8 text-[#FF6B35]" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-3 text-center">
            {t('cmsGuard.changePassword')}
          </h1>

          {recoveryLinkError ? (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {recoveryLinkError}
            </div>
          ) : null}

          <form onSubmit={handleUpdateRecoveredPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cms-new-password" className="text-gray-300">
                {t('cmsGuard.newPassword')}
              </Label>
              <Input
                id="cms-new-password"
                type="password"
                autoComplete="new-password"
                value={recoveryPassword}
                onChange={(event) => {
                  setRecoveryPassword(event.target.value);
                  if (loginError) setLoginError('');
                }}
                className="border-gray-700 bg-[#0D1016] text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cms-confirm-password" className="text-gray-300">
                {t('cmsGuard.confirmPassword')}
              </Label>
              <Input
                id="cms-confirm-password"
                type="password"
                autoComplete="new-password"
                value={recoveryConfirm}
                onChange={(event) => {
                  setRecoveryConfirm(event.target.value);
                  if (loginError) setLoginError('');
                }}
                className="border-gray-700 bg-[#0D1016] text-white"
                required
              />
            </div>

            {loginError ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {loginError}
              </div>
            ) : null}

            {resetMessage ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {resetMessage}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={recoverySaving}
              className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
            >
              {recoverySaving
                ? t('cmsGuard.saving')
                : t('cmsGuard.saveNewPassword')}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Show loading spinner while checking
  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#11141A]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35]" />
          <p className="text-sm text-gray-400">
            {t('cmsGuard.checkingPermissions')}
          </p>
        </div>
      </div>
    );
  }

  if (authState === 'mfa-enroll' || authState === 'mfa-challenge') {
    return renderMfaScreen(authState);
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
            {t('cmsGuard.loginRequired')}
          </h1>
          
          <p className="text-gray-400 mb-6 text-center">
            {authState === 'verifying'
              ? t('cmsGuard.verifyingAccess')
              : t('cmsGuard.loginRequiredDescription')}
          </p>

          <form onSubmit={handleInlineLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cms-login-email" className="text-gray-300">
                {t('cmsGuard.email')}
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
                {t('cmsGuard.password')}
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

            {resetMessage ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {resetMessage}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={loggingIn || authState === 'verifying'}
              className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
            >
              {authState === 'verifying'
                ? t('cmsGuard.verifying')
                : loggingIn
                ? t('cmsGuard.signingIn')
                : t('cmsGuard.logIn')}
            </Button>
          </form>

          <button
            type="button"
            onClick={onNeedLogin}
            disabled={authState === 'verifying'}
            className="mt-4 w-full text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t('cmsGuard.openStandardLogin')}
          </button>
          <button
            type="button"
            onClick={handleSendPasswordReset}
            disabled={authState === 'verifying' || resetSending}
            className="mt-3 w-full text-sm text-gray-400 hover:text-white transition-colors"
          >
            {resetSending
              ? t('cmsGuard.sending')
              : t('cmsGuard.changePasswordByEmail')}
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
            {t('cmsGuard.accessDenied')}
          </h1>
          
          <p className="text-gray-400 mb-2">
            {t('cmsGuard.accessDeniedDescription')}
          </p>
          
          {userEmail && (
            <p className="text-sm text-gray-500 mb-6">
              {t('cmsGuard.loggedInAs')} {userEmail}
            </p>
          )}
          
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            {t('cmsGuard.signOut')}
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
