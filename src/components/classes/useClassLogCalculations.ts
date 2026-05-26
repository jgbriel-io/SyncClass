import { parseMoneyToNumber, REGEX_PATTERNS } from "@/lib/utils/patterns";
import { brDateToIso } from "@/lib/utils/classFormHelpers";

interface Params {
  classDate: string | undefined;
  startTime: string | undefined;
  endTime: string | undefined;
  hourlyRate: number | null;
  financialAmount: string | undefined;
}

export function useClassLogCalculations({
  classDate,
  startTime,
  endTime,
  hourlyRate,
  financialAmount,
}: Params) {
  const effectiveDurationMinutes = (() => {
    if (
      startTime &&
      endTime &&
      classDate &&
      REGEX_PATTERNS.date.test(classDate)
    ) {
      const iso = brDateToIso(classDate);
      const [y, m, d] = iso.split("-").map(Number);
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const startMs = new Date(y, m - 1, d, sh, sm, 0).getTime();
      const endMs = new Date(y, m - 1, d, eh, em, 0).getTime();
      if (endMs > startMs) return Math.round((endMs - startMs) / (60 * 1000));
    }
    return null;
  })();

  const calculatedFromDuration = (() => {
    if (
      hourlyRate != null &&
      hourlyRate > 0 &&
      effectiveDurationMinutes != null &&
      effectiveDurationMinutes > 0
    ) {
      return hourlyRate * (effectiveDurationMinutes / 60);
    }
    return null;
  })();

  const computedAmount = (() => {
    const manual = financialAmount ? parseMoneyToNumber(financialAmount) : null;
    if (manual != null && !isNaN(manual) && manual > 0) return manual;
    return calculatedFromDuration;
  })();

  return { effectiveDurationMinutes, calculatedFromDuration, computedAmount };
}
