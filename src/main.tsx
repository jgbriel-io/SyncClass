import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { registerServiceWorker, setupPWAInstallPrompt } from "@/lib/pwa";

// Register Service Worker for PWA (apenas em produção)
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  registerServiceWorker();
  setupPWAInstallPrompt();
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
