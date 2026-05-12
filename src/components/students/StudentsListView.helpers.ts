import type { Student } from "@/hooks/useStudents";

export const originLabels: Record<string, string> = {
  indicacao: "Indicação",
  google: "Google",
  instagram: "Instagram",
  passante: "Passante",
  outro: "Outro",
};

/** Calcula dados derivados de uma linha (para evitar repetição no map). */
export function getStudentRowData(
  student: Student & {
    total_classes_current_month?: number;
    total_amount_current_month?: number;
  },
  teacherMap: Record<string, string>
) {
  const totalClasses = student.total_classes_current_month ?? 0;
  const monthlyTotal = student.total_amount_current_month ?? 0;
  const teacherName = student.teacher_id ? teacherMap[student.teacher_id] || "—" : "—";

  return {
    student,
    teacherName,
    totalClasses,
    monthlyTotal,
    lastClassDateRaw: null,
    daysWithoutClass: null,
    financialStatus: null,
  };
}
