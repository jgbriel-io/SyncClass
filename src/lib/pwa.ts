/**
 * Registro e gerenciamento do Service Worker
 *
 * Permite instalação PWA e funcionamento offline
 */

import { logger } from "./logger";

/**
 * Registra o Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    logger.warn("Service Worker não suportado neste navegador");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    logger.info("Service Worker registrado com sucesso", {
      componentName: "PWA",
      metadata: {
        scope: registration.scope,
      },
    });

    // Verifica atualizações do SW
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;

      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            logger.info("Nova versão do Service Worker disponível");

            // Notifica usuário sobre atualização (opcional)
            if (window.confirm("Nova versão disponível! Deseja atualizar?")) {
              window.location.reload();
            }
          }
        });
      }
    });

    return registration;
  } catch (error) {
    logger.error("Erro ao registrar Service Worker", error as Error, {
      componentName: "PWA",
    });
    return null;
  }
}

/**
 * Desregistra o Service Worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();

    if (registration) {
      const success = await registration.unregister();
      logger.info("Service Worker desregistrado", {
        componentName: "PWA",
      });
      return success;
    }

    return false;
  } catch (error) {
    logger.error("Erro ao desregistrar Service Worker", error as Error, {
      componentName: "PWA",
    });
    return false;
  }
}

/**
 * Verifica se o app está instalado como PWA
 */
export function isPWAInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

/**
 * Prompt de instalação PWA
 */
let deferredPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Captura evento de instalação PWA
 */
export function setupPWAInstallPrompt(): void {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;

    logger.info("Prompt de instalação PWA disponível", {
      componentName: "PWA",
    });
  });

  window.addEventListener("appinstalled", () => {
    logger.info("PWA instalado com sucesso", {
      componentName: "PWA",
    });
    deferredPrompt = null;
  });
}

/**
 * Mostra prompt de instalação PWA
 */
export async function showPWAInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    logger.warn("Prompt de instalação PWA não disponível", {
      componentName: "PWA",
    });
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    logger.info(
      `Usuário ${outcome === "accepted" ? "aceitou" : "recusou"} instalação PWA`,
      {
        componentName: "PWA",
      }
    );

    deferredPrompt = null;
    return outcome === "accepted";
  } catch (error) {
    logger.error("Erro ao mostrar prompt de instalação PWA", error as Error, {
      componentName: "PWA",
    });
    return false;
  }
}

/**
 * Verifica se o prompt de instalação está disponível
 */
export function isPWAInstallPromptAvailable(): boolean {
  return deferredPrompt !== null;
}
