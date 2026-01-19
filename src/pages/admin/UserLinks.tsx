import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, MoreHorizontal, Link2, Unlink, Loader2, Users, UserCheck, UserX } from "lucide-react";
import { LinkStudentDialog } from "@/components/admin/LinkStudentDialog";
import {
  useAllProfiles,
  useLinkStudentToProfile,
  useUnlinkStudentFromProfile,
  ProfileWithRole,
} from "@/hooks/useProfiles";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StatCard } from "@/components/ui/stat-card";

export default function UserLinksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfileWithRole | null>(null);
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [profileToUnlink, setProfileToUnlink] = useState<ProfileWithRole | null>(null);

  const { data: profiles = [], isLoading, error } = useAllProfiles();
  const linkStudent = useLinkStudentToProfile();
  const unlinkStudent = useUnlinkStudentFromProfile();

  // Stats
  const totalUsers = profiles.length;
  const linkedUsers = profiles.filter(p => p.student_id).length;
  const unlinkedUsers = profiles.filter(p => !p.student_id).length;

  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch =
      (profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (profile.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    const isLinked = !!profile.student_id;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "linked" && isLinked) ||
      (statusFilter === "unlinked" && !isLinked);
    
    return matchesSearch && matchesStatus;
  });

  const handleLink = (profile: ProfileWithRole) => {
    setSelectedProfile(profile);
    setLinkDialogOpen(true);
  };

  const handleLinkSubmit = (profileId: string, studentId: string) => {
    linkStudent.mutate(
      { profileId, studentId },
      {
        onSuccess: () => {
          setLinkDialogOpen(false);
          setSelectedProfile(null);
        },
      }
    );
  };

  const handleUnlinkConfirm = () => {
    if (profileToUnlink) {
      unlinkStudent.mutate(profileToUnlink.id, {
        onSuccess: () => {
          setUnlinkDialogOpen(false);
          setProfileToUnlink(null);
        },
      });
    }
  };

  const openUnlinkDialog = (profile: ProfileWithRole) => {
    setProfileToUnlink(profile);
    setUnlinkDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vínculos de Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie a vinculação entre usuários do sistema e alunos cadastrados
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Total de Usuários"
            value={totalUsers}
            icon={Users}
          />
          <StatCard
            title="Usuários Vinculados"
            value={linkedUsers}
            icon={UserCheck}
            className="border-l-green-500"
          />
          <StatCard
            title="Aguardando Vínculo"
            value={unlinkedUsers}
            icon={UserX}
            className="border-l-amber-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="linked">Vinculados</SelectItem>
              <SelectItem value="unlinked">Não vinculados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <p className="text-destructive">
              Erro ao carregar usuários. Tente novamente.
            </p>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && (
          <div className="rounded-lg border bg-card shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Usuário
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden md:table-cell">
                      Aluno Vinculado
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden lg:table-cell">
                      Data de Cadastro
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Status
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProfiles.map((profile) => (
                    <tr
                      key={profile.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-accent-foreground">
                              {profile.full_name?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {profile.full_name || "Sem nome"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        {profile.student_name ? (
                          <div className="flex items-center gap-2">
                            <Link2 className="h-4 w-4 text-primary" />
                            <span className="text-sm">{profile.student_name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {profile.created_at
                            ? format(new Date(profile.created_at), "dd/MM/yyyy", { locale: ptBR })
                            : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge
                          variant={profile.student_id ? "success" : "warning"}
                        >
                          {profile.student_id ? "Vinculado" : "Pendente"}
                        </StatusBadge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!profile.student_id ? (
                              <DropdownMenuItem onClick={() => handleLink(profile)}>
                                <Link2 className="h-4 w-4 mr-2" />
                                Vincular a Aluno
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => openUnlinkDialog(profile)}
                              >
                                <Unlink className="h-4 w-4 mr-2" />
                                Remover Vínculo
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredProfiles.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                {profiles.length === 0
                  ? "Nenhum usuário cadastrado ainda"
                  : "Nenhum usuário encontrado com esses filtros"}
              </div>
            )}
          </div>
        )}

        {/* Link Dialog */}
        <LinkStudentDialog
          open={linkDialogOpen}
          onOpenChange={(open) => {
            setLinkDialogOpen(open);
            if (!open) setSelectedProfile(null);
          }}
          profile={selectedProfile}
          onSubmit={handleLinkSubmit}
          isLoading={linkStudent.isPending}
        />

        {/* Unlink Confirmation Dialog */}
        <AlertDialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover vínculo</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover o vínculo entre o usuário{" "}
                <strong>{profileToUnlink?.full_name}</strong> e o aluno{" "}
                <strong>{profileToUnlink?.student_name}</strong>?
                <br /><br />
                O usuário perderá acesso aos dados do aluno no portal.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={unlinkStudent.isPending}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUnlinkConfirm}
                disabled={unlinkStudent.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {unlinkStudent.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removendo...
                  </>
                ) : (
                  "Remover Vínculo"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
