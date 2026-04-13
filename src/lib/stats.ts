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
  onTimeCount: number;
  avgMoneyLagDays: number;
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
    let monthLabel = "Gestión Desconocida";
    
    if (rec.gestionMes && rec.gestionAnio) {
      const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      monthLabel = `Gestión ${months[rec.gestionMes - 1]} ${rec.gestionAnio}`;
    }

    const current = statsMap.get(monthLabel) || { 
      month: monthLabel, 
      count: 0, 
      totalGenerated: 0,
      onTimeCount: 0,
      avgMoneyLagDays: 0
    };
    
    current.count += 1;
    current.totalGenerated += rec.honorariosTotal || 0;
    
    // Check compliance for session records
    if (rec.gestionMes && rec.gestionAnio && rec.items[0]?.fechaElaboracion) {
      const dElab = parseExcelDate(rec.items[0].fechaElaboracion);
      if (dElab) {
        const deadline = new Date(rec.gestionAnio, rec.gestionMes, 10); // 10th of next month (Note: months are 0-indexed in JS, so gestionMes is already the next month index if gestionMes is 1-based)
        if (dElab <= deadline) {
          current.onTimeCount++;
        }
      }
    }

    statsMap.set(monthLabel, current);
  }

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
