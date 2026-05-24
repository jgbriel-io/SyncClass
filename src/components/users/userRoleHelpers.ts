export type RoleVariant = "destructive" | "success" | "info" | "warning";

export function getRoleVariant(role: string | null): RoleVariant {
  switch (role) {
    case "admin":
      return "destructive";
    case "student":
      return "success";
    case "teacher":
      return "info";
    default:
      return "warning";
  }
}

export function getRoleLabel(role: string | null): string {
  switch (role) {
    case "admin":
      return "Administrador";
    case "student":
      return "Aluno";
    case "teacher":
      return "Professor";
    default:
      return "Sem privilégio";
  }
}
