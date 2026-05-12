import { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors, FieldValues } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Receipt } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { brDateStringToDate } from "@/lib/utils/patterns";
import { formatCurrency } from "@/lib/utils/formatters";
import type { ClassLogWithStudent } from "@/hooks/useClassLogs";

interface ClassLogFinancialSectionProps {
  register: UseFormRegister<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  watch: UseFormWatch<FieldValues>;
  errors: FieldErrors<FieldValues>;
  isEditing: boolean;
  classLog?: ClassLogWithStudent | null;
  /** Habilita seção de cobrança ao criar nova aula. */
  enableCreate?: boolean;
  isFutureDate: boolean;
  computedAmount: number | null;
  effectiveDurationMinutes: number | null;
  hourlyRate: number | null;
}

export function ClassLogFinancialSection({
  register,
  setValue,
  watch,
  errors,
  isEditing,
  classLog,
  enableCreate,
  isFutureDate,
  computedAmount,
  effectiveDurationMinutes,
  hourlyRate,
}: ClassLogFinancialSectionProps) {
  const financialDueDate = watch("financial_due_date");
  const semCobranca = watch("semCobranca");

  const hasDirectFinancial =
    classLog?.financial_records &&
    classLog.financial_records.length > 0 &&
    classLog.financial_records[0]?.id;
  const hasPackageFinancial =
    classLog?.financial_record_class_logs &&
    classLog.financial_record_class_logs.length > 0 &&
    classLog.financial_record_class_logs[0]?.financial_records?.id;

  // ── Cobrança ao criar nova aula ──────────────────────────────────────────
  if (!isEditing && enableCreate) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="semCobranca"
            checked={!!semCobranca}
            onCheckedChange={(checked) =>
              setValue("semCobranca", !!checked, { shouldValidate: true })
            }
          />
          <Label htmlFor="semCobranca" className="cursor-pointer font-normal">
            Sem cobrança
          </Label>
        </div>
        {!semCobranca && (
          <div className="space-y-4 rounded-lg border p-4 bg-accent/20">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Dados da Cobrança *
            </h4>
            {isFutureDate && (
              <p className="text-xs text-muted-foreground">
                Para aula agendada: a cobrança fica em aberto; presença e feedback podem ser
                marcados depois.
              </p>
            )}

            {/* Preview do valor calculado */}
            {computedAmount != null ? (
              <p className="text-sm text-muted-foreground">
                Valor calculado:{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(computedAmount)}
                </span>
                {effectiveDurationMinutes && hourlyRate ? (
                  <span className="ml-1">
                    ({formatCurrency(hourlyRate)}/h × {effectiveDurationMinutes} min)
                  </span>
                ) : null}
              </p>
            ) : hourlyRate == null || hourlyRate <= 0 ? (
              <p className="text-sm text-amber-600">
                Aluno sem valor/hora cadastrado. Informe o valor manualmente.
              </p>
            ) : !effectiveDurationMinutes ? (
              <p className="text-sm text-muted-foreground">
                Informe início e término para calcular o valor.
              </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="financial_amount">Valor (R$) *</Label>
                <Input
                  id="financial_amount"
                  type="text"
                  placeholder="100,00"
                  {...register("financial_amount")}
                />
                {errors.financial_amount && (
                  <p className="text-sm text-destructive">
                    {String(errors.financial_amount.message)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="financial_due_date">Vencimento *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="financial_due_date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !financialDueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {financialDueDate || "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={brDateStringToDate(financialDueDate || "") ?? undefined}
                      onSelect={(date) => {
                        if (date) {
                          setValue(
                            "financial_due_date",
                            format(date, "dd/MM/yyyy", { locale: ptBR }),
                            { shouldValidate: true }
                          );
                        }
                      }}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.financial_due_date && (
                  <p className="text-sm text-destructive">
                    {String(errors.financial_due_date.message)}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial_description">Descrição</Label>
              <Input
                id="financial_description"
                type="text"
                placeholder="Aula de inglês - Janeiro"
                {...register("financial_description")}
              />
              <p className="text-xs text-muted-foreground">
                Se não preenchido, será "Aula do dia [data]"
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial_payment_method">Método de Pagamento</Label>
              <Select
                onValueChange={(value) => setValue("financial_payment_method", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Editar cobrança existente ────────────────────────────────────────────
  if (isEditing && (hasDirectFinancial || hasPackageFinancial)) {
    return (
      <div className="space-y-4 rounded-lg border p-4 bg-accent/20">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          Dados da Cobrança
        </h4>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="financial_amount_edit">Valor (R$)</Label>
            <Input
              id="financial_amount_edit"
              type="text"
              placeholder="100,00"
              {...register("financial_amount")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="financial_due_date_edit">Vencimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="financial_due_date_edit"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10",
                    !financialDueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {financialDueDate || "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={brDateStringToDate(financialDueDate || "") ?? undefined}
                  onSelect={(date) => {
                    if (date) {
                      setValue(
                        "financial_due_date",
                        format(date, "dd/MM/yyyy", { locale: ptBR }),
                        { shouldValidate: true }
                      );
                    }
                  }}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Alterar a data da aula não altera o vencimento automaticamente; edite aqui se quiser.
        </p>
      </div>
    );
  }

  return null;
}
