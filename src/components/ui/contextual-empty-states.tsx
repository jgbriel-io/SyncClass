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
import {
  Plus,
  MagnifyingGlass,
  Calendar,
  CurrencyDollar as DollarSign,
} from "@phosphor-icons/react";
import { ui } from "@/content";

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

export function EmptyStudentsState({
  onAction,
  actionLabel = ui.emptyStates.students.actionLabel,
}: EmptyStateWithActionProps) {
  return (
    <EmptyState
      illustration={<EmptyStudentsIllustration />}
      title={ui.emptyStates.students.title}
      message={ui.emptyStates.students.description}
      actionLabel={onAction ? actionLabel : undefined}
      onAction={onAction}
      size="lg"
    />
  );
}

export function EmptyClassesState({
  onAction,
  actionLabel = ui.emptyStates.classes.actionLabel,
}: EmptyStateWithActionProps) {
  return (
    <EmptyState
      illustration={<EmptyClassesIllustration />}
      title={ui.emptyStates.classes.title}
      message={ui.emptyStates.classes.description}
      actionLabel={onAction ? actionLabel : undefined}
      onAction={onAction}
      size="lg"
    />
  );
}

export function EmptyFinancialState({
  onAction,
  actionLabel = ui.emptyStates.financial.actionLabel,
  message = ui.emptyStates.financial.description,
}: EmptyStateWithActionProps & { message?: string }) {
  return (
    <EmptyState
      illustration={<EmptyFinancialIllustration />}
      title={ui.emptyStates.financial.title}
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
      title={ui.emptyStates.history.title}
      message={ui.emptyStates.history.description}
      size="default"
    />
  );
}

export function EmptySearchState({ query }: { query?: string }) {
  return (
    <EmptyState
      illustration={<EmptySearchIllustration />}
      title={ui.emptyStates.search.title}
      message={
        query
          ? ui.emptyStates.search.description(query)
          : ui.emptyStates.search.descriptionNoQuery
      }
      size="default"
    />
  );
}

export function EmptyActivitiesState({
  onAction,
  actionLabel = ui.emptyStates.activities.actionLabel,
}: EmptyStateWithActionProps) {
  return (
    <EmptyState
      illustration={<EmptyActivitiesIllustration />}
      title={ui.emptyStates.activities.title}
      message={ui.emptyStates.activities.description}
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
      title={ui.emptyStates.activitiesStudent.title}
      message={ui.emptyStates.activitiesStudent.description}
      size="lg"
    />
  );
}

export function EmptyBirthdaysState() {
  return (
    <EmptyState
      icon={Calendar}
      title={ui.emptyStates.birthdays.title}
      message={ui.emptyStates.birthdays.description}
      size="sm"
    />
  );
}

export function EmptyPaymentsState() {
  return (
    <EmptyState
      icon={DollarSign}
      title={ui.emptyStates.payments.title}
      message={ui.emptyStates.payments.description}
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
