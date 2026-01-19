import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Link2 } from "lucide-react";
import { useStudents } from "@/hooks/useStudents";
import { ProfileWithRole } from "@/hooks/useProfiles";

interface LinkStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileWithRole | null;
  onSubmit: (profileId: string, studentId: string) => void;
  isLoading: boolean;
}

export function LinkStudentDialog({
  open,
  onOpenChange,
  profile,
  onSubmit,
  isLoading,
}: LinkStudentDialogProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const { data: students = [], isLoading: loadingStudents } = useStudents();

  // Filter to only show active students that aren't already linked
  const availableStudents = students.filter(s => s.status === "ativo");

  useEffect(() => {
    if (!open) {
      setSelectedStudentId("");
    }
  }, [open]);

  const handleSubmit = () => {
    if (profile && selectedStudentId) {
      onSubmit(profile.id, selectedStudentId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Vincular Usuário a Aluno
          </DialogTitle>
          <DialogDescription>
            Selecione o aluno que será vinculado a este usuário. Após a vinculação, 
            o usuário poderá acessar o portal do aluno e ver seus dados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Usuário</Label>
            <div className="rounded-md border bg-muted/50 px-3 py-2">
              <p className="font-medium">{profile?.full_name || "Sem nome"}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="student">Aluno</Label>
            <Select
              value={selectedStudentId}
              onValueChange={setSelectedStudentId}
              disabled={loadingStudents}
            >
              <SelectTrigger id="student">
                <SelectValue placeholder="Selecione um aluno..." />
              </SelectTrigger>
              <SelectContent>
                {availableStudents.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                    {student.email && (
                      <span className="text-muted-foreground ml-2">
                        ({student.email})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableStudents.length === 0 && !loadingStudents && (
              <p className="text-sm text-muted-foreground">
                Nenhum aluno ativo disponível para vinculação.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedStudentId || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Vinculando...
              </>
            ) : (
              "Vincular"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
