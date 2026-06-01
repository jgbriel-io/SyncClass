import type { Enums } from "@/integrations/supabase/types";

type StudentOrigin = Enums<"student_origin">;
type StudentStatus = Enums<"student_status">;

export interface AdminSubmitData {
  email: string;
  fullName: string;
  role: "admin";
}

export interface StudentSubmitData {
  email: string;
  fullName: string;
  role: "student";
  studentData: {
    name: string;
    country: string;
    state: string | null;
    city: string | null;
    phone: string | null;
    email: string;
    origin: StudentOrigin;
    status: StudentStatus;
    birth_date: string | null;
    hourly_rate: number | null;
    pay_day: number | null;
    teacher_id: string;
  };
}

export interface TeacherSubmitData {
  email: string;
  fullName: string;
  role: "teacher";
  teacherData: {
    name: string;
    email: string;
    phone?: string;
  };
}

export type UserFormSubmitData =
  | AdminSubmitData
  | StudentSubmitData
  | TeacherSubmitData;
