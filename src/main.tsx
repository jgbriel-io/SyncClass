// Initialize Sentry as early as possible in the application lifecycle
import { initSentry } from "@/lib/sentry";
initSentry();

// Import other dependencies after Sentry initialization
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "@/components/ErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
