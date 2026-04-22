import { useState } from "react";
import { Shield, FileText, Lock, AlertCircle } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";
import { PrivacyPolicySection } from "@/components/policies/PrivacyPolicySection";
import { UserRightsSection } from "@/components/policies/UserRightsSection";
import { DataRetentionSection } from "@/components/policies/DataRetentionSection";
import { TermsOfUseSection } from "@/components/policies/TermsOfUseSection";

type TabId = "privacy" | "rights" | "retention" | "terms";

interface Tab {
  id: TabId;
  label: string;
  icon: typeof Shield;
}

const tabs: Tab[] = [
  { id: "privacy", label: "Política de Privacidade", icon: Shield },
  { id: "rights", label: "Seus Direitos (LGPD)", icon: FileText },
  { id: "retention", label: "Retenção de Dados", icon: Lock },
  { id: "terms", label: "Termos de Uso", icon: AlertCircle },
];

export default function Policies() {
  const [activeTab, setActiveTab] = useState<TabId>("privacy");

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 tablet:px-6 laptop:px-8">
        <h1 className="text-lg font-semibold">Políticas da Plataforma</h1>
      </header>

      <div className="flex flex-1">
        {/* Sidebar desktop */}
        <aside className="hidden md:flex w-64 border-r bg-card">
          <nav className="flex-1 p-4 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-left">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Tabs mobile */}
        <div className="md:hidden w-full border-b bg-card">
          <div className="flex overflow-x-auto p-2 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conteúdo da aba ativa */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === "privacy" && <PrivacyPolicySection />}
          {activeTab === "rights" && <UserRightsSection />}
          {activeTab === "retention" && <DataRetentionSection />}
          {activeTab === "terms" && <TermsOfUseSection />}
        </main>
      </div>

      <Footer />
    </div>
  );
}
