import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  EmptyStudentsIllustration,
  EmptyClassesIllustration,
  EmptyFinancialIllustration,
  EmptyHistoryIllustration,
  EmptySearchIllustration,
  EmptyActivitiesIllustration,
} from "@/components/ui/empty-state-illustrations";
import { Plus, Search, Calendar, DollarSign } from "lucide-react";

/**
 * Empty States contextualizados para casos de uso específicos
 * 
 * Cada componente inclui:
 * - Ilustração customizada
 * - Mensagem humanizada
 * - CTA contextual (quando aplicável)
 */

interface EmptyStateWithActionProps {
  onAction?: () => void;
  actionLabel?: string;
}

export function EmptyStudentsState({ onAction, actionLabel = "Adicionar primeiro aluno" }: EmptyStateWithActionProps) {
  return (
    <EmptyState
      illustration={<EmptyStudentsIllustration />}
      title="Nenhum aluno cadastrado"
      message="Comece adicionando seu primeiro aluno para começar a acompanhar aulas e pagamentos."
      actionLabel={onAction ? actionLabel : undefined}
      onAction={onAction}
      size="lg"
    />
  );
}

export function EmptyClassesState({ onAction, actionLabel = "Registrar primeira aula" }: EmptyStateWithActionProps) {
  return (
    <EmptyState
      illustration={<EmptyClassesIllustration />}
      title="Nenhuma aula registrada"
      message="Registre as aulas ministradas para acompanhar o progresso e gerar cobranças automaticamente."
      actionLabel={onAction ? actionLabel : undefined}
      onAction={onAction}
      size="lg"
    />
  );
}

export function EmptyFinancialState({
  onAction,
  actionLabel = "Criar primeira cobrança",
  message = "As cobranças são criadas ao registrar aulas. Registre uma aula na aba Aulas para gerar cobranças.",
}: EmptyStateWithActionProps & { message?: string }) {
  return (
    <EmptyState
      illustration={<EmptyFinancialIllustration />}
      title="Nenhuma cobrança registrada"
      message={message}
      actionLabel={onAction ? actionLabel : undefined}
      onAction={onAction}
      size="lg"
    />
  );
}

export function EmptyHistoryState() {
  return (
    <EmptyState
      illustration={<EmptyHistoryIllustration />}
      title="Nenhum histórico disponível"
      message="As aulas realizadas aparecerão aqui com suas notas e feedback."
      size="default"
    />
  );
}

export function EmptySearchState({ query }: { query?: string }) {
  return (
    <EmptyState
      illustration={<EmptySearchIllustration />}
      title="Nenhum resultado encontrado"
      message={
        query
          ? `Não encontramos resultados para "${query}". Tente ajustar os filtros ou termos de busca.`
          : "Ajuste os filtros para ver os resultados."
      }
      size="default"
    />
  );
}

export function EmptyActivitiesState({ onAction, actionLabel = "Enviar primeira atividade" }: EmptyStateWithActionProps) {
  return (
    <EmptyState
      illustration={<EmptyActivitiesIllustration />}
      title="Nenhuma atividade enviada"
      message="Envie materiais e tarefas para seus alunos. Eles poderão entregar as respostas e você poderá corrigir aqui."
      actionLabel={onAction ? actionLabel : undefined}
      onAction={onAction}
      size="lg"
    />
  );
}

export function EmptyActivitiesStudentState() {
  return (
    <EmptyState
      illustration={<EmptyActivitiesIllustration />}
      title="Nenhuma atividade recebida"
      message="Quando seu professor enviar atividades, elas aparecerão aqui para você visualizar e entregar."
      size="lg"
    />
  );
}

export function EmptyBirthdaysState() {
  return (
    <EmptyState
      icon={Calendar}
      title="Nenhum aniversariante este mês"
      message="Quando houver aniversários próximos, eles aparecerão aqui."
      size="sm"
    />
  );
}

export function EmptyPaymentsState() {
  return (
    <EmptyState
      icon={DollarSign}
      title="Nenhum pagamento pendente"
      message="Você está em dia com todos os seus pagamentos."
      size="sm"
    />
  );
}

/**
 * Empty State genérico com possibilidade de customização
 */
interface CustomEmptyStateProps {
  title: string;
  message: string;
  onAction?: () => void;
  actionLabel?: string;
  illustration?: React.ReactNode;
  size?: "sm" | "default" | "lg";
}

export function CustomEmptyState({
  title,
  message,
  onAction,
  actionLabel,
  illustration,
  size = "default",
}: CustomEmptyStateProps) {
  return (
    <EmptyState
      illustration={illustration}
      title={title}
      message={message}
      actionLabel={onAction && actionLabel ? actionLabel : undefined}
      onAction={onAction}
      size={size}
    />
  );
}
