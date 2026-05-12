/**
 * Helpers compartilhados entre ClassLogFormDialog e PackageClassesDialog.
 * Funções puras de conversão de data/hora para formulários de aula.
 */

/** Converte data no formato dd/mm/yyyy para yyyy-mm-dd. */
export function brDateToIso(value: string): string {
  const [day, month, year] = value.split("/");
  return `${year}-${month}-${day}`;
}

/**
 * Constrói um timestamptz ISO a partir de uma data ISO (yyyy-mm-dd) e horário (HH:mm).
 * Usa o fuso local do navegador.
 */
export function buildTimestamptzFromDateAndTime(
  classDateIso: string,
  time: string
): string {
  const [y, m, d] = classDateIso.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return new Date(y, m - 1, d, h, min, 0).toISOString();
}

/**
 * Retorna a data de vencimento padrão para o mês/ano da aula.
 * Variante usada em ClassLogFormDialog: retorna "" quando a data é inválida,
 * muito antiga (> 1 ano) ou quando a aula cai depois do dia de pagamento.
 */
export function getDefaultDueDateForClassLog(
  classDateBr: string,
  payDay: number | null,
  dateRegex: RegExp
): string {
  if (!classDateBr || !dateRegex.test(classDateBr)) return "";
  if (payDay == null || payDay < 1 || payDay > 31) return "";

  const iso = brDateToIso(classDateBr);
  const classDate = new Date(iso + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  classDate.setHours(0, 0, 0, 0);

  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  if (classDate < oneYearAgo) return "";

  const [year, month, dayOfMonth] = iso.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const paymentDay = Math.min(payDay, lastDay);

  // Se a aula cai depois do dia de pagamento, não preenche automaticamente
  if (dayOfMonth > paymentDay) return "";

  const dd = paymentDay.toString().padStart(2, "0");
  const mm = month.toString().padStart(2, "0");
  return `${dd}/${mm}/${year}`;
}

/**
 * Retorna a data de vencimento padrão para o mês/ano da aula.
 * Variante usada em PackageClassesDialog: quando a data é inválida, usa hoje.
 */
export function getDefaultDueDateForPackage(
  classDateBr: string,
  payDay: number | null,
  dateRegex: RegExp
): string {
  if (!classDateBr || !dateRegex.test(classDateBr)) {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const day = Math.min(
      payDay && payDay >= 1 && payDay <= 31 ? payDay : today.getDate(),
      lastDay
    );
    const dd = String(day).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${today.getFullYear()}`;
  }
  if (payDay == null || payDay < 1 || payDay > 31) return classDateBr;

  const iso = brDateToIso(classDateBr);
  const [year, month] = iso.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(payDay, lastDay);
  const dd = day.toString().padStart(2, "0");
  const mm = month.toString().padStart(2, "0");
  return `${dd}/${mm}/${year}`;
}
