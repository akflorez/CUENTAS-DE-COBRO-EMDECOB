'use server'

import { getPrisma } from '@/lib/prisma'
import { MappedRecord } from '@/lib/mapper'
import { revalidatePath } from 'next/cache'
import { parseExcelDate } from '@/lib/utils'

export async function saveInvoiceRecord(data: MappedRecord) {
  console.log('--- saveInvoiceRecord called for:', data.consecutivo, '---');
  try {
    const prisma = getPrisma();
    
    // Verify if it exists to avoid duplicates
    const existing = await prisma.invoice.findUnique({
      where: { consecutivo: data.consecutivo }
    });

    if (existing) {
      return JSON.parse(JSON.stringify({ success: false, error: 'Invoice already exists' }));
    }

    const invoice = await prisma.invoice.create({
      data: {
        consecutivo: data.consecutivo,
        conjuntoNombre: data.conjuntoNombre,
        asesor: data.asesor,
        estadoCobro: data.estadoCobro,
        capitalTotal: data.capitalTotal,
        interesesTotal: data.interesesTotal,
        honorariosTotal: data.honorariosTotal,
        ivaTotal: data.ivaTotal,
        granTotal: data.granTotal,
        gestionMes: data.gestionMes,
        gestionAnio: data.gestionAnio,
        fechaElaboracion: parseExcelDate(data.items[0]?.fechaElaboracion),
        fechaIngresoPorte: parseExcelDate(data.items[0]?.fechaIngresoPorte),
        fechaPago: parseExcelDate(data.items[0]?.fechaPago),
        items: {
          create: data.items.map(item => ({
            fechaPago: item.fechaPago?.toString(),
            fechaIngresoPorte: item.fechaIngresoPorte?.toString(),
            fechaElaboracion: item.fechaElaboracion?.toString(),
            predio: item.predio,
            capital: item.capital,
            intereses: item.intereses,
            honorarios: item.honorarios,
            iva: item.iva,
            total: item.total
          }))
        }
      }
    });

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    await sleep(200); 

    try {
      revalidatePath('/dashboard/gestion');
    } catch (e) { console.warn('revalidatePath error:', e); }

    return JSON.parse(JSON.stringify({ success: true, invoice }));
  } catch (error: any) {
    console.error('Error saving invoice record:', error);
    return JSON.parse(JSON.stringify({ success: false, error: error.message }));
  }
}

export async function getInvoices(page: number = 1, pageSize: number = 20, conjunto?: string) {
  try {
    const prisma = getPrisma();
    const where: any = {};
    if (conjunto && conjunto !== "Todos") {
      where.conjuntoNombre = conjunto;
    }

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Tiempo de espera agotado conectando con la base de datos.")), 15000)
    );

    const [invoices, totalCount] = await Promise.race([
      Promise.all([
        (prisma.invoice as any).findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            items: true
          }
        }),
        (prisma.invoice as any).count({ where })
      ]),
      timeoutPromise
    ]) as any;

    return JSON.parse(JSON.stringify({ 
      success: true, 
      invoices, 
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    }));
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return JSON.parse(JSON.stringify({ success: false, error: error.message }));
  }
}

export async function getConjuntos() {
  try {
    const prisma = getPrisma();
    const conjuntos = await prisma.invoice.groupBy({
      by: ['conjuntoNombre'],
    });
    return JSON.parse(JSON.stringify({ success: true, conjuntos: conjuntos.map(c => c.conjuntoNombre) }));
  } catch (error: any) {
    console.error('Error fetching conjuntos:', error);
    return JSON.parse(JSON.stringify({ success: false, error: error.message }));
  }
}

export async function updateInvoiceStatus(
  id: string,
  status: string,
  fechaPago: Date | null,
  validadoTesoreria: boolean,
  montoPagado: number = 0,
  observacion?: string,
) {
  try {
    const prisma = getPrisma();
    const updated = await (prisma.invoice as any).update({
      where: { id },
      data: {
        status,
        fechaPago,
        validadoTesoreria,
        montoPagado,
        ...(observacion !== undefined ? { observacion } : {})
      }
    });
    try {
        revalidatePath('/dashboard/gestion');
        revalidatePath('/dashboard');
    } catch (e) { console.warn('revalidatePath error:', e); }

    return JSON.parse(JSON.stringify({ success: true, invoice: updated }));
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return JSON.parse(JSON.stringify({ success: false, error: error.message }));
  }
}

export async function deleteInvoice(id: string) {
  try {
    const prisma = getPrisma();
    await prisma.invoice.delete({
      where: { id }
    });
    try {
      revalidatePath('/dashboard/gestion');
      revalidatePath('/dashboard');
    } catch (e) { console.warn('revalidatePath error:', e); }
    
    return JSON.parse(JSON.stringify({ success: true }));
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    return JSON.parse(JSON.stringify({ success: false, error: error.message }));
  }
}

export async function getInvoiceStats(startDate?: Date | null, endDate?: Date | null, conjunto?: string) {
  try {
    const prisma = getPrisma();
    const where: any = {};
    // Para el histórico, siempre vamos a traer los últimos 6 meses independientemente del filtro visual del dashboard
    // Pero respetaremos el filtro de conjunto
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    where.OR = [
      { createdAt: { gte: sixMonthsAgo } }, // Lo creado recientemente
      { fechaPago: { gte: sixMonthsAgo } },  // Lo pagado recientemente (aunque se haya creado hace un año)
      { fechaElaboracion: { gte: sixMonthsAgo } } // Lo enviado recientemente
    ];

    if (startDate || endDate) {
      // Si hay filtros, solo afectarán a los totales de las tarjetas (snapshot), 
      // pero para el gráfico traeremos más data para dar contexto.
      // Implementaremos el filtrado de tarjetas en memoria abajo.
    }
    if (conjunto && conjunto !== "Todos") {
      where.conjuntoNombre = conjunto;
    }

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Tiempo de espera agotado conectando con la base de datos.")), 15000)
    );

    const invoices = await Promise.race([
      (prisma.invoice as any).findMany({ where }),
      timeoutPromise
    ]) as any[];
    
    const stats = {
      totalMetaHonorarios: 0, // La meta total inicial (fija)
      totalPendiente: 0,
      totalPagado: 0,
      totalAnulado: 0,
      countPendiente: 0,
      countPagado: 0,
      countAnulado: 0,
      avgPaymentDays: 0,
      complianceRate: 0,
      avgMoneyLagDays: 0,
      trends: [] as any[],
      cohortHistory: [] as any[] // Análisis de Metas vs Recaudo por Mes de Gestión
    };

    let totalPaymentTimeMs = 0;
    let paidCountWithDates = 0;
    let totalMoneyLagMs = 0;
    let itemsWithIntakeDate = 0;
    let onTimeCount = 0;
    let totalWithElaboracion = 0;
    
    const dailyTrends: Record<string, { generated: number, collected: number }> = {};

    // Cohort Analysis: Group by Gestion Period
    const cohortMap: Record<string, { 
      month: string, 
      meta: number, 
      collectedSameMonth: number, 
      collectedLater: number, 
      totalCollected: number, 
      count: number,
      recoveriesByMonth: Record<string, number>,
      elabMonths: Record<string, number> // { "2026-04": 15 } - tracking when invoices were sent
    }> = {};

    invoices.forEach((inv: any) => {
      const elabDate = inv.fechaElaboracion || inv.createdAt;
      const elabDateObj = new Date(elabDate);
      
      // Global snapshot filters
      const isInRange = (!startDate || elabDateObj >= new Date(startDate)) && (!endDate || elabDateObj <= new Date(endDate));

      // 1. Monthly Cohort Tracking (Smart Fallback)
      const gMes = inv.gestionMes || (elabDateObj.getMonth() + 1);
      const gAnio = inv.gestionAnio || elabDateObj.getFullYear();
      const cohortKey = `${gAnio}-${gMes.toString().padStart(2, '0')}`;

      if (!cohortMap[cohortKey]) {
        cohortMap[cohortKey] = { 
          month: cohortKey, 
          meta: 0, 
          collectedSameMonth: 0, 
          collectedLater: 0, 
          totalCollected: 0, 
          count: 0,
          recoveriesByMonth: {},
          elabMonths: {}
        };
      }
        if (inv.status !== 'ANULADA') {
          cohortMap[cohortKey].meta += inv.honorariosTotal;
          cohortMap[cohortKey].count += 1;
        }

      // Track when these were sent (elaboration)
      const elabKey = `${elabDateObj.getFullYear()}-${(elabDateObj.getMonth() + 1).toString().padStart(2, '0')}`;
      cohortMap[cohortKey].elabMonths[elabKey] = (cohortMap[cohortKey].elabMonths[elabKey] || 0) + 1;

      if ((inv.status === 'PAGADA' || (inv.montoPagado && inv.montoPagado > 0)) && inv.fechaPago) {
        const pDate = new Date(inv.fechaPago);
        
        // Vintage Tracking (Exactly when was this specific cohort paid?)
        const pMonthKey = `${pDate.getFullYear()}-${(pDate.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!cohortMap[cohortKey].recoveriesByMonth[pMonthKey]) {
          cohortMap[cohortKey].recoveriesByMonth[pMonthKey] = 0;
        }
        cohortMap[cohortKey].recoveriesByMonth[pMonthKey] += inv.montoPagado || 0;

        // Check if paid in the same management month or later
        const isSameMonth = pDate.getFullYear() === gAnio && (pDate.getMonth() + 1) === gMes;
        
        if (isSameMonth) {
          cohortMap[cohortKey].collectedSameMonth += inv.montoPagado || 0;
        } else {
          cohortMap[cohortKey].collectedLater += inv.montoPagado || 0;
        }
        cohortMap[cohortKey].totalCollected += inv.montoPagado || 0;
      }

      // 2. Dashboard Snapshot Cards
      if (isInRange) {
        if (inv.status === 'ANULADA') {
          stats.totalAnulado += inv.honorariosTotal;
          stats.countAnulado++;
          // No sumamos a la meta útil si está anulado
        } else {
          stats.totalMetaHonorarios += inv.honorariosTotal; // Meta útil (No anulados)
          
          if (inv.status === 'PAGADA') {
            stats.totalPagado += inv.montoPagado || 0;
            stats.countPagado++;
          } else {
            stats.totalPendiente += inv.honorariosTotal;
            stats.countPendiente++;
          }
        }
      }

      // 3. Trends & Other Metrics (Logic remains similar but uses honorariosTotal)
      const dateKey = elabDateObj.toISOString().split('T')[0];
      if (isInRange) {
        if (!dailyTrends[dateKey]) dailyTrends[dateKey] = { generated: 0, collected: 0 };
        dailyTrends[dateKey].generated += inv.honorariosTotal;
        if (inv.status === 'PAGADA' && inv.montoPagado) {
          dailyTrends[dateKey].collected += inv.montoPagado;
        }
      }

      // Compliance
      if (inv.gestionMes && inv.gestionAnio && elabDate) {
        const deadline = new Date(inv.gestionAnio, inv.gestionMes, 10);
        if (elabDateObj <= deadline) onTimeCount++;
        totalWithElaboracion++;
      }

      // Payment Lag
      if (inv.status === 'PAGADA' && inv.fechaPago && elabDate) {
        const diff = new Date(inv.fechaPago).getTime() - elabDateObj.getTime();
        if (diff > 0) {
          totalPaymentTimeMs += diff;
          paidCountWithDates++;
        }
      }
      
      // Money Lag
      if (inv.fechaPago && inv.fechaIngresoPorte) {
        const lag = new Date(inv.fechaIngresoPorte).getTime() - new Date(inv.fechaPago).getTime();
        if (lag >= 0) {
          totalMoneyLagMs += lag;
          itemsWithIntakeDate++;
        }
      }
    });

    stats.cohortHistory = Object.values(cohortMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);

    stats.trends = Object.entries(dailyTrends)
      .map(([date, vals]) => ({ date, ...vals }))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (paidCountWithDates > 0) {
      stats.avgPaymentDays = Math.ceil(totalPaymentTimeMs / (1000 * 60 * 60 * 24 * paidCountWithDates));
    }

    if (totalWithElaboracion > 0) {
      stats.complianceRate = Math.round((onTimeCount / totalWithElaboracion) * 100);
    }

    if (itemsWithIntakeDate > 0) {
      stats.avgMoneyLagDays = Math.ceil(totalMoneyLagMs / (1000 * 60 * 60 * 24 * itemsWithIntakeDate));
    }

    // Convert trends to array and sort
    stats.trends = Object.entries(dailyTrends)
      .map(([date, values]) => ({ date, ...values }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-15); // Show last 15 days of activity

    return JSON.parse(JSON.stringify({ success: true, stats }));
  } catch (error: any) {
    console.error('Error calculating stats:', error);
    return JSON.parse(JSON.stringify({ success: false, error: error.message }));
  }
}
