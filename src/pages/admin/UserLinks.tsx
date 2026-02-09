import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Search, MoreHorizontal, Link2, Loader2, Users, UserCheck, UserX } from "lucide-react";
import { LinkStudentDialog } from "@/components/admin/LinkStudentDialog";
import {
  useAllProfiles,
  useLinkStudentToProfile,
  ProfileWithRole,
} from "@/hooks/useProfiles";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StatCard } from "@/components/ui/stat-card";

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: profiles = [], isLoading, error } = useAllProfiles();
  const totalUsers = profiles.length;
  const filteredProfiles = profiles.filter((profile) => {
    if (!searchQuery.trim()) return true;
    return (profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
  });

  // Estado para editar/excluir
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfileWithRole | null>(null);
  const [editName, setEditName] = useState("");

  // TODO: Substituir por mutation real
  const handleEditUser = () => {
    // Aqui você faria a mutation para atualizar o nome do usuário
    setEditDialogOpen(false);
    setSelectedProfile(null);
  };
  const handleDeleteUser = () => {
    // Aqui você faria a mutation para deletar o usuário
    setDeleteDialogOpen(false);
    setSelectedProfile(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl mobile:text-2xl tablet:text-2xl laptop:text-2xl desktop:text-3xl font-semibold tracking-tight">Usuários</h1>
          <p className="text-sm mobile:text-xs tablet:text-xs mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm text-muted-foreground mt-1">
            Gerencie os usuários do sistema
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-1">
          <StatCard
            title="Total de Usuários"
            value={totalUsers}
            icon={Users}
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
            <div className="overflow-x-auto min-w-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs uppercase tracking-wider">
                    Usuário
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider hidden lg:table-cell">
                    Data de Cadastro
                  </TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {filteredProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
<span className="text-xs font-medium text-accent-foreground">
                            {profile.full_name?.charAt(0) || "?"}
                          </span>
                          </div>
                          <div className="min-w-0">
<p className="font-medium text-sm mobile:text-xs tablet:text-xs laptop:text-xs truncate">
                            {profile.full_name || "Sem nome"}
                          </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs text-muted-foreground">
                          {profile.created_at
                            ? format(new Date(profile.created_at), "dd/MM/yyyy", { locale: ptBR })
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {/* Ações futuras: editar/excluir usuário */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedProfile(profile);
                              setEditName(profile.full_name || "");
                              setEditDialogOpen(true);
                            }}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => {
                              setSelectedProfile(profile);
                              setDeleteDialogOpen(true);
                            }}>
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
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

        {/* Modal Editar Usuário */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>Altere o nome do usuário abaixo:</DialogDescription>
            </DialogHeader>
            <Input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Nome do usuário"
              autoFocus
            />
            <DialogFooter>
              <DialogClose asChild>
                <button className="btn" type="button">Cancelar</button>
              </DialogClose>
              <button className="btn btn-primary" type="button" onClick={handleEditUser} disabled={!editName.trim()}>
                Salvar
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Excluir Usuário */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Usuário</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o usuário <strong>{selectedProfile?.full_name}</strong>? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <button className="btn" type="button">Cancelar</button>
              </DialogClose>
              <button className="btn btn-destructive" type="button" onClick={handleDeleteUser}>
                Excluir
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
