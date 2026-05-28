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
      // Si ya existe, actualizamos el mes de gestión si viene uno nuevo
      if (data.gestionMes && data.gestionAnio) {
        await prisma.invoice.update({
          where: { consecutivo: data.consecutivo },
          data: { gestionMes: data.gestionMes, gestionAnio: data.gestionAnio }
        });
        return JSON.parse(JSON.stringify({ success: true, updated: true, message: 'Gestión actualizada' }));
      }
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

export async function getInvoices(
  page: number = 1, 
  pageSize: number = 20, 
  conjunto?: string, 
  genMes?: number, 
  genAnio?: number,
  search?: string,
  valor?: string
) {
  try {
    const prisma = getPrisma();
    const where: any = {};
    if (conjunto && conjunto !== "Todos") {
      where.conjuntoNombre = conjunto;
    }
    if (genMes && genMes !== 0) {
      where.generacionMes = genMes;
    }
    if (genAnio && genAnio !== 0) {
      where.generacionAnio = genAnio;
    }

    if (search && search.trim() !== "") {
      where.consecutivo = {
        contains: search.trim(),
        mode: 'insensitive'
      };
    }

    if (valor && valor.trim() !== "") {
      const searchTrimmed = valor.trim();
      // Clean dots, spaces, and currency symbols (common in Colombian currency format: e.g. 150.000 or $150.000)
      const cleanSearch = searchTrimmed.replace(/[\$\s]/g, '').replace(/\./g, '').replace(/,/g, '');
      const N = parseInt(cleanSearch);

      if (!isNaN(N)) {
        const queryStr = cleanSearch;
        const L = queryStr.length;
        const conditions: any[] = [];

        // Generate ranges from the current length up to 10 digits
        for (let D = L; D <= 10; D++) {
          const multiplier = Math.pow(10, D - L);
          const lowerBound = N * multiplier;
          const upperBound = (N + 1) * multiplier;
          
          conditions.push({
            gte: lowerBound - 0.5,
            lt: upperBound - 0.5
          });
        }

        where.OR = conditions.map(cond => ([
          { granTotal: cond },
          { honorariosTotal: cond },
          { montoPagado: cond }
        ])).flat();
      }
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
            items: true,
            payments: true
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
export async function updateInvoiceMetadata(
  id: string,
  gestionMes: number,
  gestionAnio: number,
  generacionMes: number,
  generacionAnio: number,
  fechaElaboracion: Date | null,
  consecutivo?: string
) {
  try {
    const prisma = getPrisma();
    
    // Si se está cambiando el consecutivo, verificar que no exista ya (si es diferente al actual)
    if (consecutivo) {
      const existing = await prisma.invoice.findFirst({
        where: { 
          consecutivo,
          NOT: { id }
        }
      });
      if (existing) {
        throw new Error("El número de cuenta de cobro ya existe.");
      }
    }

    const updated = await (prisma.invoice as any).update({
      where: { id },
      data: {
        gestionMes,
        gestionAnio,
        generacionMes,
        generacionAnio,
        fechaElaboracion,
        consecutivo: consecutivo || undefined
      }
    });
    try {
        revalidatePath('/dashboard/gestion');
        revalidatePath('/dashboard');
    } catch (e) { console.warn('revalidatePath error:', e); }

    return JSON.parse(JSON.stringify({ success: true, invoice: updated }));
  } catch (error: any) {
    console.error('Error updating invoice metadata:', error);
    return JSON.parse(JSON.stringify({ success: false, error: error.message }));
  }
}

export async function getInvoiceStats(startDate?: Date | null, endDate?: Date | null, conjunto?: string) {
  // Forzar datos frescos (no usar caché de Next.js)
  const { unstable_noStore } = await import('next/cache');
  unstable_noStore();
  
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
      
      // Calculate the portion of the payment that corresponds to fees (Honorarios vs Total with IVA)
      const feesRatio = inv.granTotal > 0 ? (inv.honorariosTotal / inv.granTotal) : 1;
      const feesPaid = (inv.montoPagado || 0) * feesRatio;
      
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
        cohortMap[cohortKey].recoveriesByMonth[pMonthKey] += feesPaid;

        // Check if paid in the same management month or later
        const isSameMonth = pDate.getFullYear() === gAnio && (pDate.getMonth() + 1) === gMes;
        
        if (isSameMonth) {
          cohortMap[cohortKey].collectedSameMonth += feesPaid;
        } else {
          cohortMap[cohortKey].collectedLater += feesPaid;
        }
        cohortMap[cohortKey].totalCollected += feesPaid;
      }

      // 2. Dashboard Snapshot Cards
      if (isInRange) {
        if (inv.status === 'ANULADA') {
          if (!inv.observacion?.includes("[OMITIR_STATS]")) {
            stats.totalAnulado += inv.honorariosTotal;
            stats.countAnulado++;
          }
          // No sumamos a la meta útil si está anulado
        } else {
          stats.totalMetaHonorarios += inv.honorariosTotal; // Meta útil (Honorarios Netos)
          
          // Sum up the fee portion of whatever has been paid so far
          stats.totalPagado += feesPaid; 
          
          if (inv.status === 'PAGADA') {
            stats.countPagado++;
          } else {
            // Whatever is not paid (in fees) is still pending
            // Since feesPaid is already the net fee portion, we subtract from honorariosTotal
            const pendingFees = Math.max(0, inv.honorariosTotal - feesPaid);
            stats.totalPendiente += pendingFees;
            stats.countPendiente++;
          }
        }
      }

      // 3. Trends & Other Metrics (Logic remains similar but uses honorariosTotal)
      const dateKey = elabDateObj.toISOString().split('T')[0];
      if (isInRange) {
        if (!dailyTrends[dateKey]) dailyTrends[dateKey] = { generated: 0, collected: 0 };
        dailyTrends[dateKey].generated += inv.honorariosTotal;
        if (feesPaid > 0) {
          dailyTrends[dateKey].collected += feesPaid;
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

export async function addPayment(
  invoiceId: string,
  monto: number,
  tipo: string,
  fecha: Date | string,
  metodo?: string,
  observacion?: string
) {
  try {
    const prisma = getPrisma();
    
    // 1. Create the payment
    const payment = await (prisma.payment as any).create({
      data: {
        invoiceId,
        monto,
        tipo,
        fecha: new Date(fecha),
        metodo,
        observacion: observacion || ""
      }
    });

    // 2. Recalculate invoice totals
    await recalculateInvoiceState(invoiceId, prisma);

    try {
      revalidatePath('/dashboard/gestion');
      revalidatePath('/dashboard');
    } catch (e) { console.warn('revalidatePath error:', e); }

    return JSON.parse(JSON.stringify({ success: true, payment }));
  } catch (error: any) {
    console.error('Error adding payment:', error);
    return JSON.parse(JSON.stringify({ success: false, error: error.message }));
  }
}

export async function deletePayment(paymentId: string) {
  try {
    const prisma = getPrisma();

    // 1. Find the payment to get the invoiceId
    const payment = await (prisma.payment as any).findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      return JSON.parse(JSON.stringify({ success: false, error: 'Payment not found' }));
    }

    const invoiceId = payment.invoiceId;

    // 2. Delete the payment
    await (prisma.payment as any).delete({
      where: { id: paymentId }
    });

    // 3. Recalculate invoice state
    await recalculateInvoiceState(invoiceId, prisma);

    try {
      revalidatePath('/dashboard/gestion');
      revalidatePath('/dashboard');
    } catch (e) { console.warn('revalidatePath error:', e); }

    return JSON.parse(JSON.stringify({ success: true }));
  } catch (error: any) {
    console.error('Error deleting payment:', error);
    return JSON.parse(JSON.stringify({ success: false, error: error.message }));
  }
}

async function recalculateInvoiceState(invoiceId: string, prisma: any) {
  // Get all payments for this invoice
  const payments = await (prisma.payment as any).findMany({
    where: { invoiceId }
  });

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId }
  });

  if (!invoice) return;

  let totalRecaudado = 0;
  let totalAjustes = 0;

  for (const p of payments) {
    if (p.tipo === 'RECAUDO' || p.tipo === 'CRUCE_ANTICIPO') {
      totalRecaudado += p.monto;
    } else if (p.tipo === 'DESCUENTO' || p.tipo === 'AJUSTE') {
      totalAjustes += p.monto;
    }
  }

  const totalCreditos = totalRecaudado + totalAjustes;
  const isPaid = totalCreditos >= invoice.granTotal - 0.5;

  let newStatus = invoice.status;
  if (invoice.status !== 'ANULADA') {
    newStatus = isPaid ? 'PAGADA' : 'PENDIENTE';
  }

  let latestPaymentDate = null;
  if (payments.length > 0) {
    const sorted = [...payments].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    latestPaymentDate = sorted[0].fecha;
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      montoPagado: totalRecaudado,
      status: newStatus,
      fechaPago: isPaid ? (latestPaymentDate || new Date()) : null
    }
  });
}

