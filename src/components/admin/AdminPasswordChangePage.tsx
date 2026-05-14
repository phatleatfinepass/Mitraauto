import React, { useState } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Lock, AlertCircle, Eye, EyeOff, CheckCircle2, X } from 'lucide-react';
import logo from 'figma:asset/afe29dcdd9b662431f5e9a02dfb69bc0f463496d.png';

interface AdminPasswordChangePageProps {
  onPasswordChanged: () => void;
  onChangePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  onLogout: () => void;
}

export const AdminPasswordChangePage: React.FC<AdminPasswordChangePageProps> = ({ 
  onPasswordChanged, 
  onChangePassword,
  onLogout 
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const adminPasswordText = (key: string) => t(`adminPassword.${key}`);

  // Password validation
  const validatePassword = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  };

  const validation = validatePassword(newPassword);
  const isPasswordValid = Object.values(validation).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError(adminPasswordText('passwordsDoNotMatch'));
      return;
    }

    // Validate password strength
    if (!isPasswordValid) {
      setError(adminPasswordText('passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      const result = await onChangePassword(newPassword);
      
      if (result.success) {
        onPasswordChanged();
      } else {
        setError(result.error || adminPasswordText('failed'));
      }
    } catch (err) {
      console.error('Password change error:', err);
      setError(adminPasswordText('failed'));
    } finally {
      setLoading(false);
    }
  };

  const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-sm ${
      met 
        ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
        : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
    }`}>
      {met ? (
        <CheckCircle2 className="w-4 h-4" />
      ) : (
        <X className="w-4 h-4" />
      )}
      <span>{text}</span>
    </div>
  );

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${
      theme === 'dark' ? 'bg-[#11141A]' : 'bg-gray-50'
    }`}>
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src={logo} alt="Mitra Auto" className="h-12" />
          </div>
          <h1 className={`text-3xl font-semibold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {adminPasswordText('requiredChange')}
          </h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {adminPasswordText('changeDescription')}
          </p>
        </div>

        {/* Password Change Card */}
        <Card className={`p-8 ${
          theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-200'
        }`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Field */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                {adminPasswordText('newPassword')}
              </Label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={adminPasswordText('newPasswordPlaceholder')}
                  required
                  disabled={loading}
                  className={`pl-10 pr-10 ${
                    theme === 'dark' 
                      ? 'bg-[#252525] border-white/10 text-white placeholder:text-gray-500' 
                      : 'bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                    theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  aria-label={showNewPassword ? adminPasswordText('hidePassword') : adminPasswordText('showPassword')}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                {adminPasswordText('confirmPassword')}
              </Label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={adminPasswordText('confirmPasswordPlaceholder')}
                  required
                  disabled={loading}
                  className={`pl-10 pr-10 ${
                    theme === 'dark' 
                      ? 'bg-[#252525] border-white/10 text-white placeholder:text-gray-500' 
                      : 'bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                    theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  aria-label={showConfirmPassword ? adminPasswordText('hidePassword') : adminPasswordText('showPassword')}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {newPassword && (
              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-[#252525]' : 'bg-gray-50'
              }`}>
                <p className={`text-sm font-semibold mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {adminPasswordText('passwordRequirements')}
                </p>
                <div className="space-y-1">
                  <RequirementItem met={validation.minLength} text={adminPasswordText('minLength')} />
                  <RequirementItem met={validation.hasUpperCase} text={adminPasswordText('upperCase')} />
                  <RequirementItem met={validation.hasLowerCase} text={adminPasswordText('lowerCase')} />
                  <RequirementItem met={validation.hasNumber} text={adminPasswordText('number')} />
                  <RequirementItem met={validation.hasSpecialChar} text={adminPasswordText('specialChar')} />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className={
                theme === 'dark' 
                  ? 'bg-red-950/20 border-red-900/50 text-red-400' 
                  : ''
              }>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !isPasswordValid || newPassword !== confirmPassword}
              className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white h-12"
            >
              {loading ? adminPasswordText('updating') : adminPasswordText('updatePassword')}
            </Button>

            {/* Logout Button */}
            <Button
              type="button"
              variant="ghost"
              onClick={onLogout}
              disabled={loading}
              className={`w-full ${
                theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {adminPasswordText('logout')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
