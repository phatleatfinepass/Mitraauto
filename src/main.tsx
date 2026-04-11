
  import "./index.css";

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker registration failed:", error);
      });
    });
  }

  const root = document.getElementById("root");

  async function bootstrap() {
    if (!root) {
      throw new Error("Root element not found");
    }

    const path = window.location.pathname;
    const isCmsPath = path.startsWith("/cms") || path.startsWith("/admin");

    if (isCmsPath) {
      const { mountCmsApp } = await import("./CmsApp.tsx");
      mountCmsApp(root);
      return;
    }

    const { createRoot } = await import("react-dom/client");
    const { default: App } = await import("./App.tsx");
    createRoot(root).render(<App />);
  }

  bootstrap().catch((error) => {
    console.error("App bootstrap failed:", error);
  });
  
