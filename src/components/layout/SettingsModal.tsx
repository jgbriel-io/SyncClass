import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserProfile, useUploadAvatar, useUpdateMyProfile } from "@/hooks/useUsers";
import { getAvatarLetter } from "@/lib/utils/patterns";
import { AVATAR_MAX_SIZE_BYTES, AVATAR_MAX_PX } from "@/lib/utils/avatarUpload";
import { User, Palette, Loader2, Upload, Trash2 } from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_MB = AVATAR_MAX_SIZE_BYTES / (1024 * 1024);

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { data: profile } = useCurrentUserProfile(user?.id);
  const uploadAvatar = useUploadAvatar();
  const updateAvatar = useUpdateMyProfile();
  const displayName = user?.user_metadata?.full_name ?? profile?.full_name ?? user?.email?.split("@")[0] ?? "";
  const email = user?.email ?? profile?.email ?? "";
  const avatarUrl = profile?.avatar_url ?? "";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    uploadAvatar.mutate({ userId: user.id, file });
    e.target.value = "";
  };

  const handleRemovePhoto = () => {
    if (!user?.id) return;
    updateAvatar.mutate({ userId: user.id, avatar_url: null });
  };

  const isPending = uploadAvatar.isPending || updateAvatar.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="perfil" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="perfil" className="gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="preferencias" className="gap-2">
              <Palette className="h-4 w-4" />
              Preferências
            </TabsTrigger>
          </TabsList>
          <TabsContent value="perfil" className="space-y-4 pt-4">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || undefined} alt="" />
                <AvatarFallback className="text-xl">{getAvatarLetter(displayName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2 w-full sm:w-auto">
                <Label>Foto de perfil</Label>
                <p className="text-xs text-muted-foreground">
                  Máx. {MAX_MB} MB, até {AVATAR_MAX_PX}×{AVATAR_MAX_PX} px. JPEG, PNG ou WebP.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isPending}
                  >
                    {uploadAvatar.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Enviar foto
                      </>
                    )}
                  </Button>
                  {avatarUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={handleRemovePhoto}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover foto
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-name">Nome</Label>
              <Input
                id="settings-name"
                value={displayName}
                readOnly
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-email">Email</Label>
              <Input
                id="settings-email"
                type="email"
                value={email}
                readOnly
                className="bg-muted/50"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Alteração de nome e email pode ser feita na conta do provedor de autenticação.
            </p>
          </TabsContent>
          <TabsContent value="preferencias" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Opções de tema, idioma e notificações em breve.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
