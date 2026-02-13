import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  User,
  Mail,
  Calendar,
  Shield,
  Link2,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUsersPaginated } from "@/hooks/useUsers";
import { useStudents } from "@/hooks/useStudents";
import { useTeachers } from "@/hooks/useTeachers";
import { useMemo } from "react";

interface UserDetailSheetProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getRoleLabel = (role: string | null): string => {
  if (role === "admin") return "Administrador";
  if (role === "teacher") return "Professor";
  if (role === "student") return "Aluno";
  return "Sem privilégio";
};

const getRoleVariant = (
  role: string | null
): "default" | "success" | "warning" | "destructive" | "info" => {
  if (role === "admin") return "destructive";
  if (role === "teacher") return "info";
  if (role === "student") return "success";
  return "default";
};

export function UserDetailSheet({
  userId,
  open,
  onOpenChange,
}: UserDetailSheetProps) {
  const { data: users = [] } = useUsersPaginated({ pageSize: 1000, filters: { status: "all" } });
  const { data: students = [] } = useStudents();
  const { data: teachers = [] } = useTeachers();

  const user = useMemo(
    () => users.find((u) => u.id === userId),
    [users, userId]
  );

  const linkedStudent = useMemo(
    () => user?.profile?.student_id
      ? students.find((s) => s.id === user.profile?.student_id)
      : null,
    [user, students]
  );

  const linkedTeacher = useMemo(
    () => user?.profile?.teacher_id
      ? teachers.find((t) => t.id === user.profile.teacher_id)
      : null,
    [user, teachers]
  );

  const storedRole = useMemo(() => {
    if (!user) return null;
    return (user.role?.role ?? user.profile?.role) as string | null ?? null;
  }, [user]);

  const role = useMemo(() => {
    if (storedRole === "admin") return "admin";
    if (storedRole === "teacher") return "teacher";
    if (storedRole === "student") return "student";
    if (linkedTeacher) return "teacher";
    if (linkedStudent) return "student";
    return storedRole;
  }, [storedRole, linkedTeacher, linkedStudent]);

  const displayName = user?.profile?.full_name?.trim() || "(sem nome)";
  const isActive = user?.profile?.active ?? true;

  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="text-xl font-semibold">
            Detalhes do Usuário
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-4 space-y-6">
            {!user ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <>
                {/* Header com nome e status */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{displayName}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {user.email || "Sem email"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <StatusBadge variant={isActive ? "success" : "default"}>
                      {isActive ? "Ativo" : "Inativo"}
                    </StatusBadge>
                    <StatusBadge variant={getRoleVariant(role)}>
                      {getRoleLabel(role)}
                    </StatusBadge>
                  </div>
                </div>

                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="info">Informações</TabsTrigger>
                    <TabsTrigger value="links">Vínculos</TabsTrigger>
                  </TabsList>

                  {/* Tab: Informações */}
                  <TabsContent value="info" className="space-y-4 mt-4">
                    <Card className="p-4 space-y-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Dados da Conta
                      </h3>
                      <div className="grid gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium">{user.email || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Privilégio:</span>
                          <StatusBadge variant={getRoleVariant(role)} className="text-xs">
                            {getRoleLabel(role)}
                          </StatusBadge>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Status:</span>
                          <span className="font-medium">
                            {isActive ? "Conta ativa" : "Conta arquivada"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Criado em:</span>
                          <span className="font-medium">
                            {user.created_at
                              ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })
                              : "—"}
                          </span>
                        </div>
                        {user.profile?.updated_at && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Atualizado em:</span>
                            <span className="font-medium">
                              {format(
                                new Date(user.profile.updated_at),
                                "dd/MM/yyyy HH:mm",
                                { locale: ptBR }
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </Card>
                  </TabsContent>

                  {/* Tab: Vínculos */}
                  <TabsContent value="links" className="space-y-4 mt-4">
                    <Card className="p-4">
                      <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                        <Link2 className="h-4 w-4" />
                        Vínculos com Perfis
                      </h3>

                      {!linkedStudent && !linkedTeacher ? (
                        <p className="text-sm text-muted-foreground">
                          Nenhum vínculo com aluno ou professor
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {linkedStudent && (
                            <div className="p-3 rounded-lg border bg-muted/30">
                              <div className="flex items-center gap-2 mb-2">
                                <User className="h-4 w-4 text-success" />
                                <span className="text-sm font-medium">Aluno Vinculado</span>
                              </div>
                              <div className="space-y-1 text-sm">
                                <p className="font-medium">{linkedStudent.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {linkedStudent.email || linkedStudent.phone || "—"}
                                </p>
                                <StatusBadge
                                  variant={linkedStudent.status === "ativo" ? "success" : "default"}
                                  className="text-xs mt-2"
                                >
                                  {linkedStudent.status === "ativo" ? "Ativo" : "Inativo"}
                                </StatusBadge>
                              </div>
                            </div>
                          )}

                          {linkedTeacher && (
                            <div className="p-3 rounded-lg border bg-muted/30">
                              <div className="flex items-center gap-2 mb-2">
                                <Shield className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Professor Vinculado</span>
                              </div>
                              <div className="space-y-1 text-sm">
                                <p className="font-medium">{linkedTeacher.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {linkedTeacher.email || linkedTeacher.phone || "—"}
                                </p>
                                <StatusBadge
                                  variant={linkedTeacher.status === "ativo" ? "success" : "default"}
                                  className="text-xs mt-2"
                                >
                                  {linkedTeacher.status === "ativo" ? "Ativo" : "Inativo"}
                                </StatusBadge>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
