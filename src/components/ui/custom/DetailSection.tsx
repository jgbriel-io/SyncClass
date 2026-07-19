import { ReactNode } from "react";
import type { Icon as LucideIcon } from "@phosphor-icons/react";
import { typography } from "@/lib/design-tokens/typography";
import { stack, gap } from "@/lib/design-tokens/spacing";
import { iconSize } from "@/lib/design-tokens/icon-sizes";

interface DetailSectionProps {
  icon?: LucideIcon;
  label: string;
  value: ReactNode;
  /** Se true, usa layout inline (ícone + label + valor na mesma linha) */
  inline?: boolean;
}

/**
 * Componente auxiliar para seções de detalhes
 *
 * Padroniza a exibição de informações no formato:
 * Ícone + Label + Valor
 *
 * @example
 * ```tsx
 * <DetailSection
 *   icon={Calendar}
 *   label="Data e horário"
 *   value="13/02/2026"
 * />
 * ```
 */
export function DetailSection({
  icon: Icon,
  label,
  value,
  inline = false,
}: DetailSectionProps) {
  if (inline) {
    return (
      <div
        className={`flex items-center ${gap("TIGHT")} ${typography("BODY")}`}
      >
        {Icon && (
          <Icon
            className={`${iconSize("SM")} text-muted-foreground flex-shrink-0`}
          />
        )}
        <span className="text-muted-foreground">{label}:</span>
        <span className="font-medium">{value}</span>
      </div>
    );
  }

  return (
    <div className={stack("TIGHT")}>
      <p
        className={`${typography("TABLE_HEADER")} flex items-center ${gap("TIGHT")}`}
      >
        {Icon && <Icon className={iconSize("XS")} />}
        {label}
      </p>
      <div className={`${typography("BODY")} text-foreground`}>{value}</div>
    </div>
  );
}

interface DetailSectionGroupProps {
  children: ReactNode;
}

/**
 * Agrupa múltiplas DetailSections com espaçamento consistente
 */
export function DetailSectionGroup({ children }: DetailSectionGroupProps) {
  return <div className={stack("LOOSE")}>{children}</div>;
}
