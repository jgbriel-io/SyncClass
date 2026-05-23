/**
 * Fonte única de queryKeys para TanStack Query.
 * Usar QK.* em vez de strings literais em queryKey e invalidateQueries.
 */
export const QK = {
  // Students
  STUDENTS: "students",
  STUDENTS_PAGINATED: "students_paginated",
  STUDENTS_WITH_STATS: "students_with_stats",
  STUDENTS_WITH_STATS_PAGINATED: "students_with_stats_paginated",
  STUDENTS_STATS: "students_stats",
  STUDENT_DETAILS: "student_details",
  STUDENT_BALANCE: "student_balance",
  STUDENT_STATEMENT: "student_statement",
  STUDENT_FINANCIAL_RECORDS: "student_financial_records",
  STUDENT_PROFILE: "student_profile",

  // Student portal
  STUDENT_CLASS_LOGS_V2: "student_class_logs_v2",

  // Teachers
  TEACHERS: "teachers",
  TEACHERS_PAGINATED: "teachers_paginated",
  TEACHER_USER_ID: "teacher_user_id",
  TEACHER_PIX_KEY: "teacher_pix_key",

  // Profiles
  PROFILES: "profiles",
  PROFILES_LINKED_IDS: "profiles_linked_ids",
  CURRENT_USER_PROFILE: "current_user_profile",

  // Users
  USERS: "users",
  USERS_PAGINATED: "users_paginated",
  USERS_STATS: "users_stats",

  // Class logs
  CLASS_LOGS: "class_logs",
  CLASS_LOGS_BY_STUDENT_IDS: "class_logs_by_student_ids",
  CLASS_LOGS_PENDING_EVALUATION: "class_logs_pending_evaluation",
  CLASS_LOGS_SUMMARY: "class_logs_summary",
  AVAILABLE_CLASS_LOGS: "available_class_logs",
  TODAY_CLASSES: "today_classes",

  // Financial records
  FINANCIAL_RECORDS: "financial_records",
  FINANCIAL_RECORDS_BY_STUDENT_IDS: "financial_records_by_student_ids",
  FINANCIAL_SUMMARY: "financial_summary",
  FORECASTED_BILLING: "forecasted_billing",
  UPCOMING_PAYMENTS: "upcoming_payments",

  // Activities
  ACTIVITIES: "activities",

  // Dashboard / stats
  DASHBOARD_STATS: "dashboard_stats",
  BIRTHDAYS_THIS_MONTH: "birthdays_this_month",
  NEW_STUDENTS_AND_CLASSES_BY_MONTH: "new_students_and_classes_by_month",

  // Teacher dashboard
  TEACHER_DASHBOARD_STATS: "teacher-dashboard-stats",
  TEACHER_UPCOMING_PAYMENTS: "teacher-upcoming-payments",
  TEACHER_BIRTHDAYS: "teacher-birthdays",
  TEACHER_NEW_STUDENTS_AND_CLASSES_BY_MONTH:
    "teacher-new-students-and-classes-by-month",
} as const;

export type QueryKey = (typeof QK)[keyof typeof QK];
