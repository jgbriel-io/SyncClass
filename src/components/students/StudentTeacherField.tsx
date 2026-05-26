import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Teacher } from "@/hooks/useTeachers";
import { students as studentsContent, common } from "@/content";
import { STACK } from "@/lib/design-tokens/spacing";

interface Props {
  isLoading?: boolean;
  loadingTeachers: boolean;
  autoTeacherId?: string | null;
  activeTeachers: Teacher[];
  selectedTeacherId: string;
  teacherError: string | null;
  onTeacherChange: (id: string) => void;
}

export function StudentTeacherField({
  isLoading,
  loadingTeachers,
  autoTeacherId,
  activeTeachers,
  selectedTeacherId,
  teacherError,
  onTeacherChange,
}: Props) {
  return (
    <div className={`sm:col-span-2 ${STACK.TIGHT}`}>
      <Label htmlFor="teacher">{studentsContent.formDialog.teacherLabel}</Label>
      <Select
        value={selectedTeacherId}
        onValueChange={onTeacherChange}
        disabled={isLoading || loadingTeachers || !!autoTeacherId}
      >
        <SelectTrigger>
          <SelectValue placeholder={common.placeholders.selectTeacher} />
        </SelectTrigger>
        <SelectContent>
          {activeTeachers.map((teacher) => (
            <SelectItem key={teacher.id} value={teacher.id}>
              {teacher.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {teacherError && (
        <p className="text-sm text-destructive">{teacherError}</p>
      )}
    </div>
  );
}
