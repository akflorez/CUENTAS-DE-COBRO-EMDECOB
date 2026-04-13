import { MappedRecord } from './mapper';
import { parseExcelDate, formatMonthYear } from './utils';

export interface AdvisorStats {
  name: string;
  count: number;
  totalGenerated: number;
}

export interface MonthStats {
  month: string;
  count: number;
  totalGenerated: number;
}

export const getAdvisorStats = (records: MappedRecord[]): AdvisorStats[] => {
  const statsMap = new Map<string, AdvisorStats>();

  for (const rec of records) {
    const name = rec.asesor || 'Asesor No Asignado';
    const current = statsMap.get(name) || { name, count: 0, totalGenerated: 0 };
    
    current.count += 1;
    current.totalGenerated += rec.honorariosTotal || 0;
    
    statsMap.set(name, current);
  }

  // Convert array and sort by total generated desc
  return Array.from(statsMap.values()).sort((a, b) => b.totalGenerated - a.totalGenerated);
};

export const getMonthStats = (records: MappedRecord[]): MonthStats[] => {
  const statsMap = new Map<string, MonthStats>();

  for (const rec of records) {
    // Assuming we base the month on the first item's fechaPago
    // Alternatively, we could iterate over all items if items have different dates, 
    // but usually a MappedRecord (cuenta de cobro) corresponds to one period or we just take the first payment date.
    let monthLabel = "Fecha Desconocida";
    
    if (rec.items && rec.items.length > 0) {
      const parsedDate = parseExcelDate(rec.items[0].fechaPago);
      if (parsedDate) {
        // Capitalize the first letter for better UI
        const formatted = formatMonthYear(parsedDate);
        monthLabel = formatted.charAt(0).toUpperCase() + formatted.slice(1);
      }
    }

    const current = statsMap.get(monthLabel) || { month: monthLabel, count: 0, totalGenerated: 0 };
    
    current.count += 1;
    current.totalGenerated += rec.honorariosTotal || 0;
    
    statsMap.set(monthLabel, current);
  }

  // Convert array and sort by total generated desc, or alphabetically/chronologically
  // Sorting by total generated desc for consistency with advisor stats
  return Array.from(statsMap.values()).sort((a, b) => b.totalGenerated - a.totalGenerated);
};

export const getDateRangeStats = (records: MappedRecord[]): { minDate: Date | null, maxDate: Date | null } => {
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  for (const rec of records) {
    for (const item of rec.items) {
      const parsed = parseExcelDate(item.fechaPago);
      if (!parsed) continue; // Skip invalid dates

      if (!minDate || parsed < minDate) {
        minDate = parsed;
      }
      if (!maxDate || parsed > maxDate) {
        maxDate = parsed;
      }
    }
  }

  return { minDate, maxDate };
};
