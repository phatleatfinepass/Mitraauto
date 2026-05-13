import type { TranslationDictionary } from '../types';

export const authTranslations = {
  // Auth
  'auth.login.title': { fi: 'Kirjaudu sisään', en: 'Log In' },
  'auth.login.subtitle': { fi: 'Tervetuloa takaisin! Kirjaudu sisään jatkaaksesi.', en: 'Welcome back! Log in to continue.' },
  'auth.login.email': { fi: 'Sähköposti', en: 'Email' },
  'auth.login.password': { fi: 'Salasana', en: 'Password' },
  'auth.login.submit': { fi: 'Kirjaudu', en: 'Log In' },
  'auth.login.forgot': { fi: 'Unohtuiko salasana?', en: 'Forgot password?' },
  'auth.login.noAccount': { fi: 'Ei tiliä?', en: 'No account?' },
  'auth.login.signupLink': { fi: 'Luo tili', en: 'Sign up' },
  'auth.login.google': { fi: 'Jatka Google-tilillä', en: 'Continue with Google' },
  'auth.login.apple': { fi: 'Jatka Apple-tilillä', en: 'Continue with Apple' },
  
  'auth.signup.title': { fi: 'Luo tili', en: 'Create Account' },
  'auth.signup.subtitle': { fi: 'Aloita matka kanssamme tänään.', en: 'Start your journey with us today.' },
  'auth.signup.name': { fi: 'Nimi', en: 'Name' },
  'auth.signup.email': { fi: 'Sähköposti', en: 'Email' },
  'auth.signup.password': { fi: 'Salasana', en: 'Password' },
  'auth.signup.terms': { fi: 'Hyväksyn', en: 'I accept the' },
  'auth.signup.termsLink': { fi: 'käyttöehdot', en: 'terms and conditions' },
  'auth.signup.submit': { fi: 'Luo tili', en: 'Create Account' },
  'auth.signup.hasAccount': { fi: 'Onko sinulla jo tili?', en: 'Already have an account?' },
  'auth.signup.loginLink': { fi: 'Kirjaudu sisään', en: 'Log in' },
  
  'auth.reset.title': { fi: 'Palauta salasana', en: 'Reset Password' },
  'auth.reset.description': { fi: 'Anna sähköpostiosoitteesi, niin lähetämme sinulle palautusohjeet.', en: 'Enter your email address and we\'ll send you reset instructions.' },
  'auth.reset.email': { fi: 'Sähköposti', en: 'Email' },
  'auth.reset.submit': { fi: 'Lähetä linkki', en: 'Send Link' },
  'auth.reset.success': { fi: 'Tarkista sähköpostisi', en: 'Check your email' },
  'auth.reset.backToLogin': { fi: 'Takaisin kirjautumiseen', en: 'Back to login' },
  
  // Auth Errors
  'auth.error.invalidCredentials': { fi: 'Virheellinen sähköposti tai salasana', en: 'Invalid email or password' },
  'auth.error.emailNotFound': { fi: 'Sähköpostiosoitetta ei löydy', en: 'Email not found' },
  'auth.error.invalidEmail': { fi: 'Virheellinen sähköpostiosoite', en: 'Invalid email address' },
  'auth.error.weakPassword': { fi: 'Salasana on liian heikko', en: 'Password is too weak' },
  'auth.error.emailInUse': { fi: 'Sähköposti on jo käytössä', en: 'Email already in use' },
  'auth.error.tooManyAttempts': { fi: 'Liian monta yritystä. Yritä myöhemmin uudelleen.', en: 'Too many attempts. Please try again later.' },
  'auth.error.networkError': { fi: 'Verkkovirhe. Tarkista yhteytesi.', en: 'Network error. Check your connection.' },
  'auth.error.serverError': { fi: 'Palvelinvirhe. Yritä myöhemmin uudelleen.', en: 'Server error. Please try again later.' },
  'auth.error.unexpected': { fi: 'Odottamaton virhe. Yritä uudelleen.', en: 'An unexpected error occurred. Please try again.' },
} satisfies TranslationDictionary;
