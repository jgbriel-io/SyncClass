import format from "date-fns/format";
import { ptBR } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/utils/formatters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { useStudentDetails } from "@/hooks/useStudentDetails";
import { StudentStatementTab } from "@/components/student/StudentStatementTab";

interface StudentDetailSheetProps {
  studentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const originLabels: Record<string, string> = {
  indicacao: "Indicação",
  google: "Google",
  instagram: "Instagram",
  passante: "Passante",
  outro: "Outro",
};

function formatDate(dateString: string): string {
  return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
}

function getActualStatus(record: { status: string | null; due_date: string }) {
  if (record.status === "pago") return "pago";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(record.due_date);
  return dueDate < today ? "atrasado" : "pendente";
}

export function StudentDetailSheet({
  studentId,
  open,
  onOpenChange,
}: StudentDetailSheetProps) {
  const { data: student, isLoading } = useStudentDetails(studentId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-3">
            {isLoading ? (
              <Skeleton className="h-12 w-12 rounded-full" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">
                  {student?.name?.charAt(0) || "?"}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </>
              ) : (
                <>
                  <p className="font-semibold truncate">{student?.name}</p>
                  <StatusBadge
                    variant={student?.status === "ativo" ? "success" : "default"}
                  >
                    {student?.status === "ativo" ? "Ativo" : "Inativo"}
                  </StatusBadge>
                </>
              )}
            </div>
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : student ? (
          <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-6 mt-4 grid grid-cols-4">
              <TabsTrigger value="info" className="text-xs">
                <User className="h-3.5 w-3.5 mr-1.5" />
                Dados
              </TabsTrigger>
              <TabsTrigger value="classes" className="text-xs">
                <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                Aulas
              </TabsTrigger>
              <TabsTrigger value="financial" className="text-xs">
                <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                Financeiro
              </TabsTrigger>
              <TabsTrigger value="statement" className="text-xs">
                <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                Extrato
              </TabsTrigger>
            </TabsList>

            {/* Dados Pessoais */}
            <TabsContent value="info" className="flex-1 overflow-auto m-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  {(() => {
                    const hourlyRate = student.hourly_rate;
                    const classesPerWeek = student.classes_per_week;
                    const weeklyTotal =
                      hourlyRate != null && classesPerWeek != null
                        ? hourlyRate * classesPerWeek
                        : null;
                    const payDay = student.pay_day;
                    const city = student.city;
                    const state = student.state;
                    const createdAt = student.created_at;
                    const updatedAt = student.updated_at;

                    return (
                      <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg border bg-card p-4">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                              <TrendingUp className="h-4 w-4" />
                              Frequência
                            </div>
                            <p className="text-2xl font-bold">
                              {student.stats.attendanceRate.toFixed(0)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {student.stats.presentClasses}/{student.stats.totalClasses} aulas
                            </p>
                          </div>
                          <div className="rounded-lg border bg-card p-4">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                              <BookOpen className="h-4 w-4" />
                              Média
                            </div>
                            <p className="text-2xl font-bold">
                              {student.stats.averageGrade > 0
                                ? student.stats.averageGrade.toFixed(1)
                                : "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">Nota geral</p>
                          </div>
                        </div>

                        {/* Informações Pessoais */}
                        <div className="space-y-4 mt-4">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Informações Pessoais
                          </h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">CPF</p>
                                <p className="text-sm font-medium">{student.cpf || "—"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Email</p>
                                <p className="text-sm font-medium">{student.email || "—"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Telefone</p>
                                <p className="text-sm font-medium">{student.phone || "—"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Data de Nascimento</p>
                                <p className="text-sm font-medium">
                                  {student.birth_date ? formatDate(student.birth_date) : "—"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Localização */}
                        <div className="space-y-3 mt-4">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Localização
                          </h3>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Cidade / UF</p>
                              <p className="text-sm font-medium">
                                {city || state
                                  ? `${city || "—"}${state ? ` - ${state}` : ""}`
                                  : "—"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Informações de Aula / Financeiro */}
                        <div className="space-y-3 mt-4">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Plano de aulas e cobrança
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg border bg-card p-3">
                              <p className="text-xs text-muted-foreground mb-1">Valor por hora</p>
                              <p className="text-sm font-semibold">
                                {hourlyRate != null ? formatCurrency(hourlyRate) : "—"}
                              </p>
                            </div>
                            <div className="rounded-lg border bg-card p-3">
                              <p className="text-xs text-muted-foreground mb-1">Aulas por semana</p>
                              <p className="text-sm font-semibold">
                                {classesPerWeek != null ? classesPerWeek : "—"}
                              </p>
                            </div>
                            <div className="rounded-lg border bg-card p-3">
                              <p className="text-xs text-muted-foreground mb-1">Total semanal</p>
                              <p className="text-sm font-semibold">
                                {weeklyTotal != null ? formatCurrency(weeklyTotal) : "—"}
                              </p>
                            </div>
                            <div className="rounded-lg border bg-card p-3">
                              <p className="text-xs text-muted-foreground mb-1">Dia de pagamento</p>
                              <p className="text-sm font-semibold">
                                {payDay != null ? payDay : "—"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Datas de cadastro */}
                        <div className="space-y-1 mt-4 text-xs text-muted-foreground">
                          {createdAt && (
                            <p>Cadastro em {formatDate(createdAt)}</p>
                          )}
                          {updatedAt && (
                            <p>Última edição em {formatDate(updatedAt)}</p>
                          )}
                        </div>

                        {/* Origem */}
                        <div className="space-y-2 mt-6">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Origem
                          </h3>
                          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm">
                            {student.origin
                              ? originLabels[student.origin] || student.origin
                              : "Não informado"}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Aulas */}
            <TabsContent value="classes" className="flex-1 overflow-auto m-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-lg font-bold">{student.stats.totalClasses}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="rounded-lg bg-success/10 p-3 text-center">
                      <p className="text-lg font-bold text-success">
                        {student.stats.presentClasses}
                      </p>
                      <p className="text-xs text-muted-foreground">Presenças</p>
                    </div>
                    <div className="rounded-lg bg-rose-500/10 p-3 text-center">
                      <p className="text-lg font-bold text-rose-600">
                        {student.stats.totalClasses - student.stats.presentClasses}
                      </p>
                      <p className="text-xs text-muted-foreground">Faltas</p>
                    </div>
                  </div>

                  {/* Class List */}
                  {student.classLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma aula registrada
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {student.classLogs.map((log) => (
                        <div
                          key={log.id}
                          className="rounded-lg border bg-card p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {log.attendance ? (
                                <CheckCircle className="h-4 w-4 text-success" />
                              ) : (
                                <XCircle className="h-4 w-4 text-rose-500" />
                              )}
                              <span className="text-sm font-medium">
                                {formatDate(log.class_date)}
                              </span>
                            </div>
                            {log.grade != null ? (
                              <span
                                className={`text-sm font-bold ${
                                  log.grade >= 7
                                    ? "text-success"
                                    : log.grade >= 5
                                    ? "text-amber-600"
                                    : "text-rose-600"
                                }`}
                              >
                                {Number(log.grade).toFixed(1)}
                              </span>
                            ) : log.attendance === false ? (
                              <span className="text-sm font-medium text-destructive">
                                Não compareceu
                              </span>
                            ) : null}
                          </div>
                          {log.feedback && (
                            <p className="text-xs text-muted-foreground pl-6">
                              {log.feedback}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Financeiro */}
            <TabsContent value="financial" className="flex-1 overflow-auto m-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-success/10 p-3 text-center">
                      <p className="text-sm font-bold text-success">
                        {formatCurrency(student.stats.totalPaid)}
                      </p>
                      <p className="text-xs text-muted-foreground">Pago</p>
                    </div>
                    <div className="rounded-lg bg-amber-500/10 p-3 text-center">
                      <p className="text-sm font-bold text-amber-600">
                        {formatCurrency(student.stats.totalPending)}
                      </p>
                      <p className="text-xs text-muted-foreground">Pendente</p>
                    </div>
                    <div className="rounded-lg bg-rose-500/10 p-3 text-center">
                      <p className="text-sm font-bold text-rose-600">
                        {formatCurrency(student.stats.totalOverdue)}
                      </p>
                      <p className="text-xs text-muted-foreground">Atrasado</p>
                    </div>
                  </div>

                  {/* Records List */}
                  {student.financialRecords.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum registro financeiro
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {student.financialRecords.map((record) => {
                        const actualStatus = getActualStatus(record);
                        return (
                          <div
                            key={record.id}
                            className="rounded-lg border bg-card p-3"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">
                                {formatCurrency(record.amount)}
                              </span>
                              <StatusBadge
                                variant={
                                  actualStatus === "pago"
                                    ? "success"
                                    : actualStatus === "atrasado"
                                    ? "destructive"
                                    : "warning"
                                }
                              >
                                {actualStatus === "pago"
                                  ? "Pago"
                                  : actualStatus === "atrasado"
                                  ? "Atrasado"
                                  : "Pendente"}
                              </StatusBadge>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{record.description || "Mensalidade"}</span>
                              <span>Venc: {formatDate(record.due_date)}</span>
                            </div>
                            {record.paid_at && (
                              <p className="text-xs text-success mt-1">
                                Pago em {formatDate(record.paid_at)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Extrato Consolidado */}
            <TabsContent value="statement" className="flex-1 overflow-auto m-0">
              <StudentStatementTab
                studentId={student.id}
                studentName={student.name}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            Aluno não encontrado
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
