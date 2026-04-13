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
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        const d = new Date(startDate);
        d.setHours(0, 0, 0, 0);
        where.createdAt.gte = d;
      }
      if (endDate) {
        const d = new Date(endDate);
        d.setHours(23, 59, 59, 999);
        where.createdAt.lte = d;
      }
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
      totalPendiente: 0,
      totalPagado: 0,
      totalAnulado: 0,
      countPendiente: 0,
      countPagado: 0,
      countAnulado: 0,
      avgPaymentDays: 0,
      complianceRate: 0, // % on-time
      avgMoneyLagDays: 0,
      trends: [] as any[]
    };

    let totalPaymentTimeMs = 0;
    let paidCountWithDates = 0;
    let totalMoneyLagMs = 0;
    let itemsWithIntakeDate = 0;
    let onTimeCount = 0;
    let totalWithElaboracion = 0;

    const dailyTrends: Record<string, { generated: number, collected: number }> = {};

    invoices.forEach((inv: any) => {
      // Trends by date elaborated/sent (fallback to createdAt)
      const elabDate = inv.fechaElaboracion || inv.createdAt;
      const dateKey = new Date(elabDate).toISOString().split('T')[0];
      if (!dailyTrends[dateKey]) dailyTrends[dateKey] = { generated: 0, collected: 0 };
      dailyTrends[dateKey].generated += inv.honorariosTotal;

      // Policy Compliance (by the 10th of next month of Gestion)
      if (inv.gestionMes && inv.gestionAnio && elabDate) {
        const dElab = new Date(elabDate);
        if (isNaN(dElab.getTime())) return;
        
        // Month after the Gestion period
        const deadline = new Date(inv.gestionAnio, inv.gestionMes, 10); 
        // JS Date: month index 3 is April. If gestionMes is 3 (March), then new Date(2026, 3, 10) is April 10th.
        
        if (dElab <= deadline) {
          onTimeCount++;
        }
        totalWithElaboracion++;
      }

      // Money Intake Lag
      if (inv.fechaPago && inv.fechaIngresoPorte) {
        const dPago = new Date(inv.fechaPago);
        const dIngreso = new Date(inv.fechaIngresoPorte);
        const lag = dIngreso.getTime() - dPago.getTime();
        if (lag >= 0) {
          totalMoneyLagMs += lag;
          itemsWithIntakeDate++;
        }
      }

      if (inv.status === 'PAGADA') {
        stats.totalPagado += inv.montoPagado || 0;
        stats.countPagado++;
        dailyTrends[dateKey].collected += inv.montoPagado || 0;

        if (inv.fechaPago) {
          const diff = new Date(inv.fechaPago).getTime() - new Date(inv.createdAt).getTime();
          if (diff > 0) {
            totalPaymentTimeMs += diff;
            paidCountWithDates++;
          }
        }
      } else if (inv.status === 'ANULADA') {
        stats.totalAnulado += inv.honorariosTotal;
        stats.countAnulado++;
      } else {
        stats.totalPendiente += inv.honorariosTotal;
        stats.countPendiente++;
      }
    });

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
