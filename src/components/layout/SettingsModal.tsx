import { BaseDialog } from "@/components/ui/custom/BaseDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Palette, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserProfile } from "@/hooks/useUsers";
import { SettingsPerfilTab } from "./SettingsPerfilTab";
import { SettingsSenhaTab } from "./SettingsSenhaTab";
import { SettingsPreferenciasTab } from "./SettingsPreferenciasTab";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { user } = useAuth();
  const { data: profile } = useCurrentUserProfile(user?.id);

  const displayName = user?.user_metadata?.full_name ?? profile?.full_name ?? user?.email?.split("@")[0] ?? "";
  const email = user?.email ?? profile?.email ?? "";
  const avatarUrl = profile?.avatar_url ?? "";
  const isTeacher = profile?.role === "teacher";

  return (
    <BaseDialog open={open} onOpenChange={onOpenChange} title="Configurações" size="SM">
      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="perfil" className="gap-1.5 sm:gap-2">
            <User className="h-4 w-4 shrink-0" />
            <span className="hidden xs:inline sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="senha" className="gap-1.5 sm:gap-2">
            <Lock className="h-4 w-4 shrink-0" />
            <span className="hidden xs:inline sm:inline">Senha</span>
          </TabsTrigger>
          <TabsTrigger value="preferencias" className="gap-1.5 sm:gap-2">
            <Palette className="h-4 w-4 shrink-0" />
            <span className="hidden xs:inline sm:inline">Preferências</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          {user?.id && (
            <SettingsPerfilTab
              userId={user.id}
              displayName={displayName}
              email={email}
              avatarUrl={avatarUrl}
              teacherId={profile?.teacher_id}
              isTeacher={isTeacher}
            />
          )}
        </TabsContent>

        <TabsContent value="senha">
          <SettingsSenhaTab />
        </TabsContent>

        <TabsContent value="preferencias">
          <SettingsPreferenciasTab />
        </TabsContent>
      </Tabs>
    </BaseDialog>
  );
}
