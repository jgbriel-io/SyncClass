import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useStudents } from "@/hooks/useStudents";
import { useAvailableClassLogsForStudent } from "@/hooks/useClassLogs";
import { FinancialRecordInsert } from "@/hooks/useFinancialRecords";

const financialSchema = z.object({
  student_id: z.string().min(1, "Selecione um aluno"),
  class_log_id: z.string().optional(),
  amount: z.string().min(1, "Informe o valor"),
  due_date: z.string().min(1, "Informe a data de vencimento"),
  description: z.string().optional(),
});

type FinancialFormData = z.infer<typeof financialSchema>;

interface FinancialFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FinancialRecordInsert) => void;
  isLoading: boolean;
}

function formatClassLogDate(dateString: string): string {
  return format(new Date(dateString + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR });
}

export function FinancialFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: FinancialFormDialogProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedClassLogId, setSelectedClassLogId] = useState<string>("");
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: availableClassLogs = [], isLoading: loadingClassLogs } = useAvailableClassLogsForStudent(
    selectedStudentId || null
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FinancialFormData>({
    resolver: zodResolver(financialSchema),
  });

  useEffect(() => {
    if (!open) {
      reset();
      setSelectedStudentId("");
      setSelectedClassLogId("");
    }
  }, [open, reset]);

  // Reset class log when student changes
  useEffect(() => {
    setSelectedClassLogId("");
    setValue("class_log_id", "");
  }, [selectedStudentId, setValue]);

  const handleFormSubmit = (data: FinancialFormData) => {
    const amount = parseFloat(data.amount.replace(/[^\d,.-]/g, "").replace(",", "."));
    
    onSubmit({
      student_id: data.student_id,
      class_log_id: data.class_log_id && data.class_log_id !== "none" ? data.class_log_id : null,
      amount: amount,
      due_date: data.due_date,
      description: data.description || null,
      status: "pendente",
    });
  };

  const handleStudentChange = (value: string) => {
    setSelectedStudentId(value);
    setValue("student_id", value);
  };

  const handleClassLogChange = (value: string) => {
    setSelectedClassLogId(value);
    setValue("class_log_id", value === "none" ? undefined : value);
  };

  // Filter only active students
  const activeStudents = students.filter((s) => s.status === "ativo");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Cobrança</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Student Select */}
          <div className="space-y-2">
            <Label>Aluno *</Label>
            <Select
              value={selectedStudentId}
              onValueChange={handleStudentChange}
              disabled={loadingStudents}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um aluno" />
              </SelectTrigger>
              <SelectContent>
                {activeStudents.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" {...register("student_id")} />
            {errors.student_id && (
              <p className="text-sm text-destructive">{errors.student_id.message}</p>
            )}
          </div>

          {/* Class Log Select */}
          <div className="space-y-2">
            <Label>Aula Vinculada (opcional)</Label>
            <Select
              value={selectedClassLogId}
              onValueChange={handleClassLogChange}
              disabled={!selectedStudentId || loadingClassLogs}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !selectedStudentId 
                    ? "Selecione um aluno primeiro" 
                    : loadingClassLogs 
                      ? "Carregando aulas..." 
                      : "Selecione uma aula (opcional)"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem aula vinculada</SelectItem>
                {availableClassLogs.map((log) => (
                  <SelectItem key={log.id} value={log.id}>
                    {formatClassLogDate(log.class_date)}
                    {log.attendance === false && " (Falta)"}
                    {log.grade && ` - Nota: ${log.grade}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStudentId && availableClassLogs.length === 0 && !loadingClassLogs && (
              <p className="text-xs text-muted-foreground">
                Nenhuma aula disponível para vincular (todas já têm cobrança ou não há aulas cadastradas)
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$) *</Label>
            <Input
              id="amount"
              type="text"
              placeholder="450,00"
              {...register("amount")}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date">Data de Vencimento *</Label>
            <Input
              id="due_date"
              type="date"
              {...register("due_date")}
            />
            {errors.due_date && (
              <p className="text-sm text-destructive">{errors.due_date.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Ex: Mensalidade Jan/2025"
              rows={2}
              {...register("description")}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Criar Cobrança"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
