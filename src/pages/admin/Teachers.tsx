import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { TeacherFormDialog } from "@/components/teachers/TeacherFormDialog";
import {
  useTeachers,
  useCreateTeacher,
  useUpdateTeacher,
  useDeleteTeacher,
  Teacher,
} from "@/hooks/useTeachers";

export default function TeachersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  const { data: teachers = [], isLoading, error } = useTeachers();
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();

  const filteredTeachers = teachers.filter((teacher) => {
    return teacher.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleCreateOrUpdate = (data: any) => {
    if (selectedTeacher) {
      updateTeacher.mutate(
        { id: selectedTeacher.id, ...data },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            setSelectedTeacher(null);
          },
        }
      );
    } else {
      createTeacher.mutate(data, {
        onSuccess: () => {
          setIsFormOpen(false);
        },
      });
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsFormOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (teacherToDelete) {
      deleteTeacher.mutate(teacherToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setTeacherToDelete(null);
        },
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Professores</h1>
          <p className="text-muted-foreground mt-1">Gerencie os professores do sistema</p>
        </div>
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
          <Button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" /> Novo Professor
          </Button>
        </div>
        {/* Table */}
        <div className="rounded-lg border bg-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Nome
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Email
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Telefone
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-sm">{teacher.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{teacher.email || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{teacher.phone || "—"}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 mr-2" onClick={() => handleEdit(teacher)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setTeacherToDelete(teacher); setDeleteDialogOpen(true); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredTeachers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {teachers.length === 0
                ? "Nenhum professor cadastrado ainda"
                : "Nenhum professor encontrado com esses filtros"}
            </div>
          )}
        </div>

        {/* Formulário de cadastro/edição */}
        <TeacherFormDialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setSelectedTeacher(null);
          }}
          teacher={selectedTeacher}
          onSubmit={handleCreateOrUpdate}
          isLoading={createTeacher.isPending || updateTeacher.isPending}
        />

        {/* Modal de exclusão */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Professor</DialogTitle>
            </DialogHeader>
            <p>Tem certeza que deseja excluir o professor <strong>{teacherToDelete?.name}</strong>? Esta ação não pode ser desfeita.</p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} disabled={deleteTeacher.isPending}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteTeacher.isPending}>
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
