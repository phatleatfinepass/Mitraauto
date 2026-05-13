import { createRoot } from "react-dom/client";
import SiteApp from "./SiteApp.tsx";
import { mountCmsPwaApp } from "./CmsPwaApp.tsx";
import "./index.css";
import { isInstalledPwaDisplay, isStandalonePwaDeploy } from "./config/runtime";

const root = document.getElementById("root");

function isCmsPwaRuntimePath(path: string) {
  return (
    isStandalonePwaDeploy ||
    path === '/pwa' ||
    path.startsWith('/pwa/') ||
    (isInstalledPwaDisplay() && (path === '/cms' || path.startsWith('/cms/')))
  );
}

function bootstrap() {
  if (!root) {
    throw new Error("Root element not found");
  }

  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  if (isCmsPwaRuntimePath(path)) {
    mountCmsPwaApp(root);
  } else {
    createRoot(root).render(<SiteApp />);
  }

  const bootElement = document.getElementById("app-boot");
  if (bootElement) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bootElement.setAttribute("data-hidden", "true");
        window.setTimeout(() => bootElement.remove(), 260);
      });
    });
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    const shouldUseServiceWorker = isCmsPwaRuntimePath(path);

    if (shouldUseServiceWorker) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service worker registration failed:', error);
      });
      return;
    }

    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch((error) => {
        console.error('Service worker unregister failed:', error);
      });
  });
}

try {
  bootstrap();
} catch (error) {
  console.error("App bootstrap failed:", error);
}
