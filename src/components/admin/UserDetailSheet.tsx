import { BaseDetailSheet } from "@/components/ui/custom/BaseDetailSheet";
import { DetailSection } from "@/components/ui/custom/DetailSection";
import { formatPhoneDisplay } from "@/lib/utils/format-phone";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
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
    <BaseDetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Detalhes do Usuário"
      subtitle={
        !user ? (
          <Skeleton className="h-8 w-3/4" />
        ) : (
          <>
            <h2 className="text-2xl font-bold">{displayName}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {user.email || "Sem email"}
            </p>
            <div className="flex flex-row gap-2 items-center mt-2">
              <StatusBadge variant={isActive ? "success" : "default"}>
                {isActive ? "Ativo" : "Inativo"}
              </StatusBadge>
              <StatusBadge variant={getRoleVariant(role)}>
                {getRoleLabel(role)}
              </StatusBadge>
            </div>
          </>
        )
      }
      size="XL"
      noScroll
    >
      {!user ? (
        <div className="p-6 space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-4 grid w-full grid-cols-2">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="links">Vínculos</TabsTrigger>
          </TabsList>

          {/* Tab: Informações */}
          <TabsContent value="info" className="flex-1 overflow-auto m-0 px-6 py-4">
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Dados da Conta
              </h3>
              <div className="grid gap-4 text-sm">
                <DetailSection icon={Mail} label="Email" value={user.email || "—"} inline />
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Privilégio:</span>
                  <StatusBadge variant={getRoleVariant(role)} className="text-xs">
                    {getRoleLabel(role)}
                  </StatusBadge>
                </div>
                <DetailSection
                  icon={FileText}
                  label="Status"
                  value={isActive ? "Conta ativa" : "Conta arquivada"}
                  inline
                />
                <DetailSection
                  icon={Calendar}
                  label="Criado em"
                  value={
                    user.created_at
                      ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })
                      : "—"
                  }
                  inline
                />
                {user.profile?.updated_at && (
                  <DetailSection
                    icon={Calendar}
                    label="Atualizado em"
                    value={format(
                      new Date(user.profile.updated_at),
                      "dd/MM/yyyy HH:mm",
                      { locale: ptBR }
                    )}
                    inline
                  />
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Tab: Vínculos */}
          <TabsContent value="links" className="flex-1 overflow-auto m-0 px-6 py-4">
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
                          {linkedStudent.email || formatPhoneDisplay(linkedStudent.phone, linkedStudent.country) || "—"}
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
                          {linkedTeacher.email || formatPhoneDisplay(linkedTeacher.phone, "Brasil") || "—"}
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
      )}
    </BaseDetailSheet>
  );
}
