import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseExcelDate(excelDate: any): Date | null {
  if (!excelDate) return null;
  
  if (excelDate instanceof Date) {
      if (!isNaN(excelDate.getTime())) return excelDate;
  }

  if (typeof excelDate === 'number') {
    // Excel epoch starts at Jan 1, 1900.
    // Excel incorrectly assumes 1900 is a leap year.
    const excelEpoch = new Date(Date.UTC(1899, 11, 30)); 
    return new Date(excelEpoch.getTime() + excelDate * 86400000);
  }

  if (typeof excelDate === 'string') {
    // Attempt to parse DD/MM/YYYY or YYYY-MM-DD
    const parts = excelDate.split(/[-/T ]/);
    if (parts.length >= 3) {
      if (parts[0].length === 4) {
        const d = new Date(excelDate);
        if (!isNaN(d.getTime())) return d;
      } else {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        let year = parseInt(parts[2], 10);
        if (year < 100) year += 2000;
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d;
      }
    }
    const fallback = new Date(excelDate);
    if (!isNaN(fallback.getTime())) return fallback;
  }

  return null;
}

export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(date);
}
