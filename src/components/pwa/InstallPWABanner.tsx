import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, X } from "lucide-react";
import { isPWAInstalled, isPWAInstallPromptAvailable, showPWAInstallPrompt } from "@/lib/pwa";
import { toast } from "sonner";

/**
 * Banner para instalação do PWA
 * Aparece apenas se:
 * 1. PWA não está instalado
 * 2. Prompt de instalação está disponível
 * 3. Usuário não fechou o banner (localStorage)
 */
export function InstallPWABanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Verifica se deve mostrar o banner
    const checkVisibility = () => {
      // Não mostra se já está instalado
      if (isPWAInstalled()) {
        return false;
      }

      // Não mostra se usuário já fechou o banner
      const dismissed = localStorage.getItem("pwa-banner-dismissed");
      if (dismissed === "true") {
        return false;
      }

      // Não mostra se prompt não está disponível
      if (!isPWAInstallPromptAvailable()) {
        return false;
      }

      return true;
    };

    // Aguarda um pouco para o prompt estar disponível
    const timer = setTimeout(() => {
      setIsVisible(checkVisibility());
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const accepted = await showPWAInstallPrompt();
      
      if (accepted) {
        toast.success("App instalado com sucesso!");
        setIsVisible(false);
      } else {
        toast.info("Instalação cancelada");
      }
    } catch (error) {
      toast.error("Erro ao instalar o app");
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-banner-dismissed", "true");
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 shadow-lg border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Download className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">
              Instalar App
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Acesse mais rápido instalando o app na sua tela inicial. Funciona offline!
            </p>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1"
              >
                {isInstalling ? "Instalando..." : "Instalar"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                disabled={isInstalling}
              >
                Agora não
              </Button>
            </div>
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0"
            onClick={handleDismiss}
            disabled={isInstalling}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
