import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LanguageProvider } from './components/LanguageContext';
import { ThemeProvider } from './components/ThemeContext';
import { CmsGuard } from './components/cms/CmsGuard';
import { CmsInstallPrompt } from './components/cms/CmsInstallPrompt';

const AuthModal = lazy(() => import('./components/AuthModal').then((m) => ({ default: m.AuthModal })));
const CmsBriefingBoard = lazy(() => import('./components/cms/CmsBriefingBoard').then((m) => ({ default: m.CmsBriefingBoard })));
const AdminSchedulePage = lazy(() => import('./components/admin/AdminSchedulePage').then((m) => ({ default: m.AdminSchedulePage })));
const TiresCMSPage = lazy(() => import('./components/cms/TiresCMSPageV2').then((m) => ({ default: m.TiresCMSPageV2 })));
const RimsCMSPage = lazy(() => import('./components/cms/RimsCMSPageV2').then((m) => ({ default: m.RimsCMSPageV2 })));
const OrdersCMSPage = lazy(() => import('./components/cms/OrdersCMSPage').then((m) => ({ default: m.OrdersCMSPage })));

type CmsPage = 'admin-schedule' | 'cms-dashboard' | 'cms-pwa' | 'cms-tires' | 'cms-rims' | 'cms-orders';
type CmsTab = 'schedule' | 'catalog-tires' | 'catalog-rims' | 'orders' | 'future';
type AuthView = 'login' | 'signup';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function resolveCmsTabFromHash(hash?: string): CmsTab {
  const normalized = (hash ?? '').replace('#', '').toLowerCase();

  if (normalized === 'catalog-tires') return 'catalog-tires';
  if (normalized === 'catalog-rims') return 'catalog-rims';
  if (normalized === 'orders') return 'orders';
  if (normalized === 'future') return 'future';

  return 'schedule';
}

function RouteFallback() {
  return (
    <div className="min-h-[100dvh] bg-[#11141A]">
      <div className="mx-auto flex min-h-[100dvh] max-w-md items-center justify-center px-4">
        <div className="text-sm text-gray-400">Loading CMS...</div>
      </div>
    </div>
  );
}

function CmsShell() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [currentPage, setCurrentPage] = useState<CmsPage>('cms-dashboard');
  const [cmsTab, setCmsTab] = useState<CmsTab>('schedule');
  const [pendingProtectedPath, setPendingProtectedPath] = useState<string | null>(null);
  const [showCmsInstallPrompt, setShowCmsInstallPrompt] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  const isStandaloneMode = useCallback(() => {
    return window.matchMedia('(display-mode: standalone)').matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  }, []);

  const isMobileDevice = useCallback(() => {
    return window.matchMedia('(max-width: 1024px) and (pointer: coarse)').matches;
  }, []);

  const isIosDevice = useCallback(() => {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  }, []);

  const maybeShowCmsInstallPrompt = useCallback(() => {
    if (window.location.pathname !== '/cms-pwa') {
      return;
    }

    if (!isMobileDevice() || isStandaloneMode()) {
      return;
    }

    setShowCmsInstallPrompt(true);
  }, [isMobileDevice, isStandaloneMode]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1024px) and (pointer: coarse)');
    const update = () => setIsMobileViewport(media.matches);
    update();
    media.addEventListener('change', update);

    return () => {
      media.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredInstallPrompt(null);
      setShowCmsInstallPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const updatePageFromPath = useCallback(
    (path: string) => {
      if (path === '/cms-pwa') {
        setCurrentPage('cms-pwa');
        return;
      }

      if (path === '/admin/schedule') {
        setCurrentPage('admin-schedule');
        return;
      }

      if (path === '/cms/orders' || path === '/cms-orders') {
        setCurrentPage('cms-orders');
        return;
      }

      if (path === '/cms/tires' || path === '/cms-tires') {
        setCurrentPage('cms-tires');
        return;
      }

      if (path === '/cms/rims' || path === '/cms-rims') {
        setCurrentPage('cms-rims');
        return;
      }

      setCurrentPage('cms-dashboard');
      const nextHash = window.location.hash;
      const resolvedTab = nextHash ? resolveCmsTabFromHash(nextHash) : 'schedule';
      setCmsTab(resolvedTab);
    },
    [],
  );

  const navigate = useCallback((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    updatePageFromPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [updatePageFromPath]);

  useEffect(() => {
    const handleNavigation = () => updatePageFromPath(window.location.pathname);
    const handleHashChange = () => {
      if (window.location.pathname === '/cms') {
        setCmsTab(resolveCmsTabFromHash(window.location.hash));
      }
    };

    handleNavigation();
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [updatePageFromPath]);

  const handleCmsTabChange = (tab: CmsTab) => {
    setCmsTab(tab);
    if (window.location.pathname === '/cms') {
      window.history.replaceState(window.history.state, '', `/cms#${tab}`);
    }
  };

  const handleLoginNeeded = () => {
    setPendingProtectedPath(`${window.location.pathname}${window.location.hash}`);
    setAuthView('login');
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (isAdmin?: boolean) => {
    const destination = pendingProtectedPath;
    setPendingProtectedPath(null);

    if (destination) {
      const [path, hash = ''] = destination.split('#');
      navigate(path || '/cms');
      if (hash) {
        window.history.replaceState(window.history.state, '', `${path}#${hash}`);
        setCmsTab(resolveCmsTabFromHash(`#${hash}`));
      }
      maybeShowCmsInstallPrompt();
      return;
    }

    if (isAdmin) {
      navigate(window.location.pathname === '/cms-pwa' ? '/cms-pwa' : '/cms');
      maybeShowCmsInstallPrompt();
    }
  };

  const handleCmsInstall = useCallback(async () => {
    if (!deferredInstallPrompt) {
      setShowCmsInstallPrompt(false);
      return;
    }

    await deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    setDeferredInstallPrompt(null);
  }, [deferredInstallPrompt]);

  const cmsTabs = [
    { id: 'schedule' as const, label: 'Booking Schedule', description: 'Manage appointments' },
    { id: 'catalog-tires' as const, label: 'Tire Catalog', description: 'Edit tire content' },
    { id: 'catalog-rims' as const, label: 'Rim Catalog', description: 'Edit rim content' },
    { id: 'orders' as const, label: 'Orders', description: 'Track customer purchases' },
    { id: 'future' as const, label: 'Future Tools', description: 'Coming soon' },
  ];

  return (
    <div className="min-h-screen bg-[#11141A] text-white">
      {authModalOpen ? (
        <Suspense fallback={null}>
          <AuthModal
            open={authModalOpen}
            onOpenChange={setAuthModalOpen}
            defaultView={authView}
            onSuccess={handleAuthSuccess}
          />
        </Suspense>
      ) : null}

      {currentPage === 'cms-pwa' ? (
        <CmsInstallPrompt
          open={showCmsInstallPrompt}
          onOpenChange={setShowCmsInstallPrompt}
          canInstall={Boolean(deferredInstallPrompt)}
          isIos={isIosDevice()}
          onInstall={handleCmsInstall}
        />
      ) : null}

      <main id="main-content">
        <Suspense fallback={<RouteFallback />}>
          {currentPage === 'cms-pwa' ? (
            <CmsGuard onNeedLogin={handleLoginNeeded}>
              <CmsBriefingBoard />
            </CmsGuard>
          ) : currentPage === 'admin-schedule' ? (
            <CmsGuard onNeedLogin={handleLoginNeeded}>
              <AdminSchedulePage />
            </CmsGuard>
          ) : currentPage === 'cms-tires' ? (
            <CmsGuard onNeedLogin={handleLoginNeeded}>
              <TiresCMSPage />
            </CmsGuard>
          ) : currentPage === 'cms-rims' ? (
            <CmsGuard onNeedLogin={handleLoginNeeded}>
              <RimsCMSPage />
            </CmsGuard>
          ) : currentPage === 'cms-orders' ? (
            <CmsGuard onNeedLogin={handleLoginNeeded}>
              <OrdersCMSPage />
            </CmsGuard>
          ) : (
            <CmsGuard onNeedLogin={handleLoginNeeded}>
              <div className="bg-background text-foreground">
                <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">Desktop CMS</p>
                        <h1 className="text-3xl font-semibold text-foreground">Admin Console</h1>
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
                        Full admin workspace
                      </span>
                    </div>
                    <p className="text-muted-foreground max-w-3xl">
                      Use the full admin tools here for schedule, product catalog, and order management. The phone-first operational app now lives separately at /cms-pwa.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="inline-flex rounded-lg border bg-card p-1 shadow-sm">
                      {cmsTabs.map((tab) => {
                        const isActive = cmsTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => handleCmsTabChange(tab.id)}
                            className={`flex min-w-[180px] items-start gap-2 rounded-md px-4 py-3 text-left transition-colors ${
                              isActive
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="font-semibold">{tab.label}</span>
                              {tab.description ? (
                                <span className={`text-xs ${isActive ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                                  {tab.description}
                                </span>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-xl border bg-card shadow-sm">
                    {cmsTab === 'schedule' ? (
                      <AdminSchedulePage />
                    ) : cmsTab === 'catalog-tires' ? (
                      <TiresCMSPage />
                    ) : cmsTab === 'catalog-rims' ? (
                      <RimsCMSPage />
                    ) : cmsTab === 'orders' ? (
                      <OrdersCMSPage />
                    ) : (
                      <div className="space-y-2 p-8 text-muted-foreground">
                        <h2 className="text-xl font-semibold text-foreground">Coming soon</h2>
                        <p>Reserved for upcoming CMS modules.</p>
                      </div>
                    )}
                  </div>
                  {isMobileViewport ? (
                    <div className="rounded-xl border border-dashed bg-card p-5 text-sm text-muted-foreground">
                      Open <span className="font-medium text-foreground">/cms-pwa</span> on phone for the dedicated mobile operations app.
                    </div>
                  ) : null}
                </div>
              </div>
            </CmsGuard>
          )}
        </Suspense>
      </main>
    </div>
  );
}

export default function CmsApp() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <CmsShell />
      </LanguageProvider>
    </ThemeProvider>
  );
}

export function mountCmsApp(container: HTMLElement) {
  createRoot(container).render(<CmsApp />);
}
