import { Navigate, useLocation, Link } from "react-router-dom";
import { User, Lock, Palette, CreditCard, ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserProfile } from "@/hooks/useUsers";
import { SettingsPerfilTab } from "@/components/layout/SettingsPerfilTab";
import { SettingsSenhaTab } from "@/components/layout/SettingsSenhaTab";
import { SettingsPreferenciasTab } from "@/components/layout/SettingsPreferenciasTab";
import { SettingsPagamentosTab } from "@/components/layout/SettingsPagamentosTab";
import { cn } from "@/lib/utils";
import { layout } from "@/content";

type TabId = "perfil" | "senha" | "preferencias" | "pagamentos";

const ALL_TABS = [
  { id: "perfil" as TabId, label: layout.settings.tabs.profile, icon: User },
  { id: "senha" as TabId, label: layout.settings.tabs.password, icon: Lock },
  {
    id: "preferencias" as TabId,
    label: layout.settings.tabs.preferences,
    icon: Palette,
  },
  {
    id: "pagamentos" as TabId,
    label: layout.settings.tabs.payments,
    icon: CreditCard,
    teacherOnly: true,
  },
];

export default function SettingsPage() {
  const location = useLocation();
  const { user } = useAuth();
  const { data: profile } = useCurrentUserProfile(user?.id);

  const parts = location.pathname.split("/");
  const settingsIdx = parts.findIndex((p) => p === "settings");
  const basePath = parts.slice(0, settingsIdx + 1).join("/");
  const rolePath = parts.slice(0, settingsIdx).join("/") || "/";
  const activeTab = parts[settingsIdx + 1] as TabId | undefined;

  const isTeacher = profile?.role === "teacher";
  const displayName =
    user?.user_metadata?.full_name ??
    profile?.full_name ??
    user?.email?.split("@")[0] ??
    "";
  const email = user?.email ?? profile?.email ?? "";
  const avatarUrl = profile?.avatar_url ?? "";

  const tabs = ALL_TABS.filter((t) => !t.teacherOnly || isTeacher);
  const validTabIds = tabs.map((t) => t.id);

  if (!activeTab || !validTabIds.includes(activeTab)) {
    return <Navigate to={`${basePath}/perfil`} replace />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "perfil":
        if (!user?.id) return null;
        return (
          <SettingsPerfilTab
            userId={user.id}
            displayName={displayName}
            email={email}
            avatarUrl={avatarUrl}
            teacherId={profile?.teacher_id}
            isTeacher={isTeacher}
          />
        );
      case "senha":
        return <SettingsSenhaTab />;
      case "preferencias":
        return <SettingsPreferenciasTab />;
      case "pagamentos":
        return profile?.teacher_id ? (
          <SettingsPagamentosTab teacherId={profile.teacher_id} />
        ) : null;
    }
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Back */}
      <Link
        to={rolePath}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        {layout.settings.backLabel}
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">
        {layout.settings.title}
      </h1>

      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
        {/* Left nav — vertical on desktop, horizontal scroll on mobile */}
        <nav className="sm:w-44 sm:shrink-0">
          <ul className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <li key={tab.id} className="shrink-0 sm:shrink">
                  <Link
                    to={`${basePath}/${tab.id}`}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <tab.icon className="h-4 w-4 shrink-0" />
                    {tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Content card */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="border-b px-6 py-4">
              <h2 className="font-semibold text-base">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h2>
            </div>
            <div className="px-6">{renderContent()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
