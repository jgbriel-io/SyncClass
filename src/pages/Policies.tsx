import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Shield, FileText, Lock, AlertCircle } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

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
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 tablet:px-6 laptop:px-8">
        <h1 className="text-lg font-semibold">Políticas da Plataforma</h1>
      </header>

      {/* Main content */}
      <div className="flex flex-1">
        {/* Sidebar */}
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

        {/* Mobile tabs */}
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

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === "privacy" && <PrivacyPolicy />}
          {activeTab === "rights" && <UserRights />}
          {activeTab === "retention" && <DataRetention />}
          {activeTab === "terms" && <TermsOfUse />}
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

function PrivacyPolicy() {
  return (
    <div className="w-full px-4 tablet:px-6 laptop:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Política de Privacidade</h2>
      </div>

      <div className="space-y-4 text-sm text-muted-foreground">
        <p>
          A JLAC English Platform está comprometida com a proteção dos seus dados pessoais,
          em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
        </p>

        <div className="space-y-2">
          <h3 className="font-medium text-foreground">Dados Coletados</h3>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Nome completo, email e telefone para cadastro</li>
            <li>CPF para identificação fiscal (opcional)</li>
            <li>Histórico de aulas e pagamentos</li>
            <li>Atividades e avaliações acadêmicas</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-foreground">Uso dos Dados</h3>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Gestão de aulas e agendamentos</li>
            <li>Controle financeiro e emissão de cobranças</li>
            <li>Comunicação sobre aulas e atividades</li>
            <li>Melhoria dos serviços educacionais</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-foreground">Segurança</h3>
          <p>
            Seus dados são protegidos por criptografia e armazenados em servidores seguros.
            Implementamos controles de acesso rigorosos (RLS) para garantir que cada usuário
            veja apenas seus próprios dados.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-foreground">Compartilhamento</h3>
          <p>
            Seus dados pessoais NÃO são compartilhados com terceiros. Apenas professores
            vinculados têm acesso aos dados de seus alunos, e vice-versa, exclusivamente
            para fins educacionais.
          </p>
        </div>
      </div>
    </div>
  );
}

function UserRights() {
  return (
    <div className="w-full px-4 tablet:px-6 laptop:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-success" />
        </div>
        <h2 className="text-xl font-semibold">Seus Direitos (LGPD)</h2>
      </div>

      <div className="space-y-4 text-sm text-muted-foreground">
        <p>Conforme a LGPD, você tem direito a:</p>

        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <span className="font-medium text-foreground">Acesso:</span> Consultar seus dados pessoais armazenados
          </li>
          <li>
            <span className="font-medium text-foreground">Correção:</span> Atualizar dados incompletos ou incorretos
          </li>
          <li>
            <span className="font-medium text-foreground">Exclusão:</span> Solicitar a remoção de seus dados pessoais
          </li>
          <li>
            <span className="font-medium text-foreground">Portabilidade:</span> Receber seus dados em formato estruturado
          </li>
          <li>
            <span className="font-medium text-foreground">Revogação:</span> Retirar consentimento a qualquer momento
          </li>
        </ul>

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
          <p className="text-blue-900 dark:text-blue-100 text-sm">
            <span className="font-medium">Como exercer seus direitos:</span> Entre em contato com
            o administrador da plataforma através do email cadastrado ou solicite diretamente
            ao seu professor.
          </p>
        </div>
      </div>
    </div>
  );
}

function DataRetention() {
  return (
    <div className="w-full px-4 tablet:px-6 laptop:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
          <Lock className="h-5 w-5 text-warning" />
        </div>
        <h2 className="text-xl font-semibold">Retenção de Dados</h2>
      </div>

      <div className="space-y-4 text-sm text-muted-foreground">
        <p>
          Em caso de solicitação de exclusão de dados, seguimos o seguinte procedimento:
        </p>

        <div className="space-y-2">
          <h3 className="font-medium text-foreground">Exclusão Imediata</h3>
          <p>
            Seus dados pessoais identificáveis (nome, CPF, telefone, email) são
            <span className="font-medium text-foreground"> anonimizados imediatamente</span>
            após a solicitação.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-foreground">Retenção Fiscal (5 anos)</h3>
          <p>
            Conforme legislação fiscal brasileira, mantemos dados anonimizados de transações
            financeiras por 5 anos para fins de auditoria contábil. Estes dados não permitem
            sua identificação pessoal.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-foreground">Exclusão Definitiva</h3>
          <p>
            Após 5 anos, todos os dados são excluídos definitivamente do sistema,
            incluindo histórico de aulas e cobranças.
          </p>
        </div>
      </div>
    </div>
  );
}

function TermsOfUse() {
  return (
    <div className="w-full px-4 tablet:px-6 laptop:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold">Termos de Uso</h2>
      </div>

      <div className="space-y-4 text-sm text-muted-foreground">
        <div className="space-y-2">
          <h3 className="font-medium text-foreground">Responsabilidades do Usuário</h3>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Manter suas credenciais de acesso em sigilo</li>
            <li>Fornecer informações verdadeiras e atualizadas</li>
            <li>Utilizar a plataforma apenas para fins educacionais</li>
            <li>Respeitar direitos autorais de materiais didáticos</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-foreground">Uso Proibido</h3>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Compartilhar conta com terceiros</li>
            <li>Tentar acessar dados de outros usuários</li>
            <li>Realizar atividades ilegais ou fraudulentas</li>
            <li>Sobrecarregar ou prejudicar o funcionamento da plataforma</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-foreground">Modificações</h3>
          <p>
            Reservamo-nos o direito de modificar estas políticas a qualquer momento.
            Usuários serão notificados sobre mudanças significativas.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 mt-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Dúvidas ou Solicitações?</h3>
          <p className="text-sm">
            Para exercer seus direitos, esclarecer dúvidas ou fazer solicitações relacionadas
            aos seus dados pessoais, entre em contato com o administrador da plataforma.
          </p>
          <p className="text-xs mt-2">
            Última atualização: 16 de fevereiro de 2026
          </p>
        </div>
      </div>
    </div>
  );
}
