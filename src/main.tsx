import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { isStandalonePwaDeploy } from "./config/runtime";

const root = document.getElementById("root");

async function bootstrap() {
  if (!root) {
    throw new Error("Root element not found");
  }

  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  if (isStandalonePwaDeploy || path === '/pwa' || path.startsWith('/pwa/')) {
    const { mountCmsPwaApp } = await import("./CmsPwaApp.tsx");
    mountCmsPwaApp(root);
  } else {
    createRoot(root).render(<App />);
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
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}

bootstrap().catch((error) => {
  console.error("App bootstrap failed:", error);
});
