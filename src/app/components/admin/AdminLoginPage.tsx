import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import logo from 'figma:asset/afe29dcdd9b662431f5e9a02dfb69bc0f463496d.png';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsPasswordChange?: boolean }>;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess, onLogin }) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = (key: string) => {
    const translations: Record<string, { fi: string; en: string }> = {
      adminLogin: { fi: 'Admin-kirjautuminen', en: 'Admin Login' },
      adminPortal: { fi: 'Admin-portaali', en: 'Admin Portal' },
      email: { fi: 'Sähköposti', en: 'Email' },
      password: { fi: 'Salasana', en: 'Password' },
      login: { fi: 'Kirjaudu sisään', en: 'Login' },
      loginDescription: { fi: 'Kirjaudu sisään hallintapaneeliin', en: 'Sign in to access the admin panel' },
      emailPlaceholder: { fi: 'admin@mitra-auto.fi', en: 'admin@mitra-auto.fi' },
      passwordPlaceholder: { fi: 'Syötä salasanasi', en: 'Enter your password' },
      loggingIn: { fi: 'Kirjaudutaan...', en: 'Logging in...' },
      showPassword: { fi: 'Näytä salasana', en: 'Show password' },
      hidePassword: { fi: 'Piilota salasana', en: 'Hide password' },
    };
    return translations[key]?.[language] || key;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await onLogin(email, password);
      
      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(language === 'fi' ? 'Kirjautuminen epäonnistui' : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

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
            {t('adminPortal')}
          </h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('loginDescription')}
          </p>
        </div>

        {/* Login Card */}
        <Card className={`p-8 ${
          theme === 'dark' ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-200'
        }`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                {t('email')}
              </Label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  required
                  disabled={loading}
                  className={`pl-10 ${
                    theme === 'dark' 
                      ? 'bg-[#252525] border-white/10 text-white placeholder:text-gray-500' 
                      : 'bg-white'
                  }`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                {t('password')}
              </Label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('passwordPlaceholder')}
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
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                    theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

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
              disabled={loading}
              className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white h-12"
            >
              {loading ? t('loggingIn') : t('login')}
            </Button>
          </form>
        </Card>

        {/* Footer Note */}
        <p className={`text-center text-sm mt-6 ${
          theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
        }`}>
          {language === 'fi' ? 'Vain valtuutetuille käyttäjille' : 'Authorized users only'}
        </p>
      </div>
    </div>
  );
};
