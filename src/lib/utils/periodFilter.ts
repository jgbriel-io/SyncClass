import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";

export type PeriodFilter = "month" | "semester" | "year";

export interface DateRange {
  from: string;
  to: string;
}

export function getDateRangeForPeriod(period: PeriodFilter): DateRange {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  switch (period) {
    case "month":
      return {
        from: format(startOfMonth(now), "yyyy-MM-dd"),
        to: format(endOfMonth(now), "yyyy-MM-dd"),
      };
    case "semester": {
      // H1 = jan–jun (months 0–5), H2 = jul–dez (months 6–11)
      const isH1 = month < 6;
      const semesterStart = new Date(year, isH1 ? 0 : 6, 1);
      const semesterEnd = endOfMonth(new Date(year, isH1 ? 5 : 11, 1));
      return {
        from: format(semesterStart, "yyyy-MM-dd"),
        to: format(semesterEnd, "yyyy-MM-dd"),
      };
    }
    case "year":
      return {
        from: format(startOfYear(now), "yyyy-MM-dd"),
        to: format(endOfYear(now), "yyyy-MM-dd"),
      };
  }
}
