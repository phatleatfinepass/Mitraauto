import React, { useState } from 'react';
import { Menu, X, ShoppingCart, User, LogIn, Moon, Sun, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';
import logo from 'figma:asset/afe29dcdd9b662431f5e9a02dfb69bc0f463496d.png';

interface NavbarProps {
  isLoggedIn: boolean;
  onLoginClick: () => void;
  onSignupClick: () => void;
  onLogout: () => void;
  cartCount?: number;
  onNavigate?: (path: string) => void;
}

export function Navbar({
  isLoggedIn,
  onLoginClick,
  onSignupClick,
  onLogout,
  cartCount = 0,
  onNavigate,
}: NavbarProps) {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleLanguage = () => {
    setLanguage(language === 'fi' ? 'en' : 'fi');
  };

  const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (onNavigate && (path === '/' || path === '/services' || path === '/tire-hotel')) {
      event.preventDefault();
      onNavigate(path);
      // Scroll to top of page smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }

    return false;
  };
  
  const navLinks = [
    { key: 'nav.home', href: '/' },
    { key: 'nav.services', href: '/services' },
    { key: 'nav.catalog', href: '/catalog' },
    { key: 'nav.tireHotel', href: '/tire-hotel' },
    // Temporarily hidden - Used Cars
    // { key: 'nav.usedCars', href: '/used-cars' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/60">
      <div className="container mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-60"
            onClick={(event) => handleLinkClick(event, '/')}
          >
            <img
              src={logo}
              alt="Mitra Auto"
              className="h-8 w-auto dark:brightness-0 dark:invert" 
            />
            <span className="text-lg font-semibold tracking-tight">Mitra Auto</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.key}
                href={link.href}
                className="px-3 py-2 text-sm font-normal text-foreground/80 hover:text-foreground transition-colors"
                onClick={(event) => handleLinkClick(event, link.href)}
              >
                {t(link.key)}
              </a>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleTheme}
              className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-secondary transition-all"
              aria-label={t('ui.theme.toggle')}
            >
              {theme === 'dark' ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
            </button>

            {/* Language Switcher */}
            <button 
              onClick={toggleLanguage}
              className="hidden sm:inline-flex h-9 px-3 items-center justify-center gap-1.5 rounded-full text-foreground/60 hover:text-foreground hover:bg-secondary transition-all"
              aria-label={t('ui.language.toggle')}
            >
              <Globe className="h-[18px] w-[18px]" />
              <span className="text-xs font-semibold uppercase">{language}</span>
            </button>

            {/* Cart */}
            <button 
              className="relative hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-secondary transition-all"
              aria-label={t('nav.cart')}
            >
              <ShoppingCart className="h-[18px] w-[18px]" />
              {cartCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full bg-accent border-0 p-0 flex items-center justify-center text-xs">
                  {cartCount}
                </Badge>
              )}
            </button>

            {/* Account Menu */}
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-secondary transition-all">
                    <User className="h-[18px] w-[18px]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <a href="/dashboard">{t('nav.dashboard')}</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/orders">{t('nav.orders')}</a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout}>
                    {t('nav.signout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button 
                onClick={onLoginClick}
                className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-secondary transition-all"
                aria-label={t('nav.login')}
              >
                <LogIn className="h-[18px] w-[18px]" />
              </button>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-secondary transition-all">
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] gap-0">
                <SheetHeader className="pb-4">
                  <SheetTitle>{t('nav.menu')}</SheetTitle>
                  <SheetDescription>
                    {t('nav.menuDescription')}
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-6 px-4 pb-4 overflow-y-auto">
                  {/* Mobile Nav Links */}
                  <nav className="flex flex-col gap-1">
                    {navLinks.map((link) => (
                      <a
                        key={link.key}
                        href={link.href}
                        className="px-3 py-2 text-base rounded-lg hover:bg-secondary transition-colors"
                        onClick={(event) => {
                          handleLinkClick(event, link.href);
                          setMobileMenuOpen(false);
                        }}
                      >
                        {t(link.key)}
                      </a>
                    ))}
                  </nav>

                  {/* Mobile Auth */}
                  {!isLoggedIn ? (
                    <div className="flex flex-col gap-2">
                      <Button onClick={() => { onLoginClick(); setMobileMenuOpen(false); }} className="w-full">
                        {t('nav.login')}
                      </Button>
                      <Button variant="outline" onClick={() => { onSignupClick(); setMobileMenuOpen(false); }} className="w-full">
                        {t('nav.signup')}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <a
                        href="/dashboard"
                        className="px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                        onClick={(event) => {
                          handleLinkClick(event, '/dashboard');
                          setMobileMenuOpen(false);
                        }}
                      >
                        {t('nav.dashboard')}
                      </a>
                      <a
                        href="/orders"
                        className="px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                        onClick={(event) => {
                          handleLinkClick(event, '/orders');
                          setMobileMenuOpen(false);
                        }}
                      >
                        {t('nav.orders')}
                      </a>
                      <Button variant="outline" onClick={() => { onLogout(); setMobileMenuOpen(false); }} className="mt-2">
                        {t('nav.signout')}
                      </Button>
                    </div>
                  )}

                  {/* Mobile Theme & Language */}
                  <div className="flex flex-col gap-2 pt-4 border-t border-border">
                    <button
                      onClick={toggleTheme}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        {theme === 'dark' ? (
                          <Sun className="h-5 w-5" />
                        ) : (
                          <Moon className="h-5 w-5" />
                        )}
                        <span>{theme === 'dark' ? t('ui.theme.light') : t('ui.theme.dark')}</span>
                      </span>
                    </button>
                    
                    <button
                      onClick={toggleLanguage}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <Globe className="h-5 w-5" />
                        <span>{language === 'fi' ? t('ui.language.switchToEn') : t('ui.language.switchToFi')}</span>
                      </span>
                      <span className="text-xs font-semibold uppercase text-muted-foreground">{language}</span>
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
