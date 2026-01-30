import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/utils/formatters";
import {
  BookOpen,
  DollarSign,
  CheckCircle,
  XCircle,
  Calendar,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { StudentClassLog, StudentFinancialRecord } from "@/hooks/useStudentDetails";

interface StudentStatementTabProps {
  classLogs: StudentClassLog[];
  financialRecords: StudentFinancialRecord[];
  studentName: string;
}

type StatementEntry = {
  id: string;
  date: string;
  type: "class" | "financial";
  data: StudentClassLog | StudentFinancialRecord;
};

function formatDate(dateString: string): string {
  return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
}

function getActualStatus(record: StudentFinancialRecord): string {
  if (record.status === "pago") return "pago";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(record.due_date);
  return dueDate < today ? "atrasado" : "pendente";
}

export function StudentStatementTab({
  classLogs,
  financialRecords,
  studentName,
}: StudentStatementTabProps) {
  // Combinar aulas e cobranças em uma única timeline
  const entries: StatementEntry[] = [
    ...classLogs.map((log) => ({
      id: log.id,
      date: log.class_date,
      type: "class" as const,
      data: log,
    })),
    ...financialRecords.map((record) => ({
      id: record.id,
      date: record.due_date, // Usar due_date para ordenação
      type: "financial" as const,
      data: record,
    })),
  ];

  // Ordenar por data (mais recente primeiro)
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calcular saldo corrente (running balance)
  let runningBalance = 0;
  const entriesWithBalance = entries.map((entry) => {
    if (entry.type === "financial") {
      const record = entry.data as StudentFinancialRecord;
      const amount = Number(record.amount) || 0;
      
      if (record.status === "pago") {
        runningBalance += amount; // Pagamento = crédito
      } else {
        runningBalance -= amount; // Cobrança pendente = débito
      }
    }
    
    return {
      ...entry,
      balance: runningBalance,
    };
  }).reverse(); // Inverter para mostrar o saldo correto (do mais antigo para o mais recente)

  const currentBalance = entriesWithBalance.length > 0 
    ? entriesWithBalance[entriesWithBalance.length - 1].balance 
    : 0;

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-4">
        {/* Header com saldo atual */}
        <div className="rounded-lg border-2 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Saldo Atual</p>
              <p className={`text-3xl font-bold ${
                currentBalance >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}>
                {formatCurrency(Math.abs(currentBalance))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {currentBalance >= 0 ? "Crédito disponível" : "Em aberto"}
              </p>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
              currentBalance >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"
            }`}>
              {currentBalance >= 0 ? (
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-rose-600" />
              )}
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Aula</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            <span>Cobrança</span>
          </div>
        </div>

        {/* Timeline */}
        {entriesWithBalance.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum registro encontrado</p>
            <p className="text-sm mt-1">
              O histórico aparecerá aqui quando houver aulas ou cobranças
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entriesWithBalance.map((entry, index) => {
              const isLastEntry = index === entriesWithBalance.length - 1;
              
              if (entry.type === "class") {
                const classLog = entry.data as StudentClassLog;
                
                return (
                  <div
                    key={entry.id}
                    className="relative pl-8 pb-3"
                  >
                    {/* Timeline line */}
                    {!isLastEntry && (
                      <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-border" />
                    )}
                    
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-2 h-8 w-8 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    
                    {/* Content */}
                    <div className="rounded-lg border bg-card p-3 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {classLog.attendance ? (
                            <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
                          )}
                          <div>
                            <p className="text-sm font-medium">
                              Aula - {formatDate(classLog.class_date)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {classLog.attendance ? "Presença" : "Falta"}
                            </p>
                          </div>
                        </div>
                        {classLog.grade !== null && (
                          <span
                            className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                              classLog.grade >= 7
                                ? "bg-emerald-500/10 text-emerald-600"
                                : classLog.grade >= 5
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-rose-500/10 text-rose-600"
                            }`}
                          >
                            {Number(classLog.grade).toFixed(1)}
                          </span>
                        )}
                      </div>
                      {classLog.feedback && (
                        <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                          {classLog.feedback}
                        </p>
                      )}
                    </div>
                  </div>
                );
              } else {
                const record = entry.data as StudentFinancialRecord;
                const actualStatus = getActualStatus(record);
                
                return (
                  <div
                    key={entry.id}
                    className="relative pl-8 pb-3"
                  >
                    {/* Timeline line */}
                    {!isLastEntry && (
                      <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-border" />
                    )}
                    
                    {/* Timeline dot */}
                    <div className={`absolute left-0 top-2 h-8 w-8 rounded-full bg-background border-2 flex items-center justify-center ${
                      actualStatus === "pago" 
                        ? "border-emerald-500/50" 
                        : actualStatus === "atrasado"
                        ? "border-rose-500/50"
                        : "border-amber-500/50"
                    }`}>
                      <DollarSign className={`h-4 w-4 ${
                        actualStatus === "pago" 
                          ? "text-emerald-600" 
                          : actualStatus === "atrasado"
                          ? "text-rose-600"
                          : "text-amber-600"
                      }`} />
                    </div>
                    
                    {/* Content */}
                    <div className={`rounded-lg border bg-card p-3 shadow-sm ${
                      actualStatus === "pago" 
                        ? "border-emerald-200/50 dark:border-emerald-800/50" 
                        : actualStatus === "atrasado"
                        ? "border-rose-200/50 dark:border-rose-800/50"
                        : ""
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium">
                            {record.description || "Cobrança"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Vencimento: {formatDate(record.due_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">
                            {formatCurrency(record.amount)}
                          </p>
                          <StatusBadge
                            variant={
                              actualStatus === "pago"
                                ? "success"
                                : actualStatus === "atrasado"
                                ? "destructive"
                                : "warning"
                            }
                            className="text-xs"
                          >
                            {actualStatus === "pago"
                              ? "Pago"
                              : actualStatus === "atrasado"
                              ? "Atrasado"
                              : "Pendente"}
                          </StatusBadge>
                        </div>
                      </div>
                      {record.paid_at && (
                        <p className="text-xs text-emerald-600 border-t pt-2 mt-2">
                          ✓ Pago em {formatDate(record.paid_at)}
                        </p>
                      )}
                      {/* Saldo após esta transação */}
                      <div className="border-t pt-2 mt-2 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Saldo após esta transação:</span>
                        <span className={`font-medium ${
                          entry.balance >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}>
                          {formatCurrency(Math.abs(entry.balance))}
                          {entry.balance >= 0 ? " (crédito)" : " (débito)"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t text-xs text-muted-foreground text-center">
          <p>Extrato completo de {studentName}</p>
          <p className="mt-1">
            {classLogs.length} aula{classLogs.length !== 1 ? "s" : ""} • {" "}
            {financialRecords.length} cobrança{financialRecords.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </ScrollArea>
  );
}
