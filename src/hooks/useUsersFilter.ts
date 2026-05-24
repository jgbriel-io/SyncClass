import { useMemo } from "react";
import { UserWithProfile } from "@/hooks/useUsers";
import { UsersFiltersState } from "@/components/filters/UsersFilters";

export function useUsersFilter(
  users: UserWithProfile[],
  filters: UsersFiltersState
): UserWithProfile[] {
  return useMemo(() => {
    let result = users.filter((user) => {
      const name = user.profile?.full_name || "";
      const email = user.email || "";
      const searchLower = filters.search.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        name.toLowerCase().includes(searchLower) ||
        email.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;

      const storedRole = (user.role?.role ?? user.profile?.role) as
        | string
        | null;
      const linkedStudent = user.profile?.student_id;
      const linkedTeacher = user.profile?.teacher_id;
      const role =
        storedRole === "admin"
          ? "admin"
          : storedRole === "teacher"
            ? "teacher"
            : storedRole === "student"
              ? "student"
              : linkedTeacher
                ? "teacher"
                : linkedStudent
                  ? "student"
                  : storedRole;

      const matchesRole =
        filters.role === "all" ||
        (filters.role === "admin" && role === "admin") ||
        (filters.role === "teacher" && role === "teacher") ||
        (filters.role === "student" && role === "student");
      if (!matchesRole) return false;

      const isActive = user.profile?.active ?? true;
      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "active" && isActive) ||
        (filters.status === "inactive" && !isActive);
      if (!matchesStatus) return false;

      return true;
    });

    const sortBy = filters.sortBy;
    result = [...result].sort((a, b) => {
      const nameA = (a.profile?.full_name || a.email || "").toLowerCase();
      const nameB = (b.profile?.full_name || b.email || "").toLowerCase();
      const createdA = new Date(
        a.profile?.created_at || a.created_at || 0
      ).getTime();
      const createdB = new Date(
        b.profile?.created_at || b.created_at || 0
      ).getTime();

      if (sortBy === "created_desc") return createdB - createdA;
      if (sortBy === "created_asc") return createdA - createdB;
      if (sortBy === "name_asc") return nameA.localeCompare(nameB);
      if (sortBy === "name_desc") return nameB.localeCompare(nameA);
      return 0;
    });

    return result;
  }, [users, filters]);
}
