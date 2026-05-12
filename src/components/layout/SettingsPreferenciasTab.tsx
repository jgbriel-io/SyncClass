import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { isPWAInstalled, isPWAInstallPromptAvailable, showPWAInstallPrompt } from "@/lib/pwa";

export function SettingsPreferenciasTab() {
  return (
    <div className="space-y-4 pt-4">
      <p className="text-sm text-muted-foreground">
        Opções de tema, idioma e notificações em breve.
      </p>

      {!isPWAInstalled() && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Instalar App
          </Label>
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground mb-3">
              Instale o app na sua tela inicial para acesso mais rápido e funcionamento offline.
            </p>
            <Button
              onClick={async () => {
                if (isPWAInstallPromptAvailable()) {
                  const accepted = await showPWAInstallPrompt();
                  if (accepted) toast.success("App instalado com sucesso!");
                } else {
                  toast.info("Use o menu do navegador para instalar o app");
                }
              }}
              className="w-full"
              disabled={!isPWAInstallPromptAvailable()}
            >
              <Download className="h-4 w-4 mr-2" />
              Instalar App
            </Button>
          </div>
        </div>
      )}

      {isPWAInstalled() && (
        <div className="rounded-lg border bg-success/10 border-success/20 p-3">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">App instalado!</span>
          </div>
        </div>
      )}
    </div>
  );
}
