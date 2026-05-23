export const ROLES = ["admin", "student", "teacher"] as const;
export type Role = (typeof ROLES)[number];

export function log(msg: string, data?: Record<string, unknown>) {
  console.log(`[invite-user] ${msg}`, data ?? "");
}

export function randomPassword(length = 12): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  let p = "";
  for (let i = 0; i < length; i++) p += chars.charAt(array[i] % chars.length);
  return p;
}

export function friendlyDuplicateError(msg: string): string {
  if (
    msg.includes("Telefone já cadastrado na plataforma") ||
    msg.includes("teachers_unique_phone") ||
    msg.includes("students_unique_phone")
  )
    return "Telefone já cadastrado na plataforma";
  if (
    msg.includes("students_unique_email") ||
    (msg.includes("duplicate key") && msg.toLowerCase().includes("email"))
  )
    return "Email já cadastrado";
  return msg;
}

export function normalizeDigits(val: string | null | undefined): string {
  if (!val || typeof val !== "string") return "";
  return val.replace(/\D/g, "");
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 255;

export function isValidEmailFormat(email: string): boolean {
  const trimmed = email?.trim() ?? "";
  if (trimmed.length === 0 || trimmed.length > EMAIL_MAX_LENGTH) return false;
  return EMAIL_REGEX.test(trimmed);
}

export function cleanInsertData(
  data: Record<string, unknown>
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === "" || value === undefined) continue;
    cleaned[key] = value;
  }
  return cleaned;
}
