"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { getAdvisorStats, getMonthStats, getDateRangeStats } from "@/lib/stats";
import { groupRecords } from "@/lib/mapper";
import { 
  Users, 
  FileSpreadsheet, 
  Building2, 
  ExternalLink, 
  CalendarDays, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Scale, 
  Zap,
  TrendingUp, 
  BarChart3, 
  Timer, 
  X,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { getInvoiceStats, getConjuntos } from "@/app/actions/invoice";
import SearchableSelect from "@/components/SearchableSelect";

export default function DashboardIndex() {
  const router = useRouter();
  const { excelData, filesData, startingConsecutive } = useAppContext();

  // Agrupamos inmediatamente los registros del Excel
  const mappedRecords = useMemo(() => {
    return groupRecords(excelData, startingConsecutive);
  }, [excelData, startingConsecutive]);

  const advisorStats = useMemo(() => getAdvisorStats(mappedRecords), [mappedRecords]);
  const monthStats = useMemo(() => getMonthStats(mappedRecords), [mappedRecords]);
  const { minDate, maxDate } = useMemo(() => getDateRangeStats(mappedRecords), [mappedRecords]);
  
  const [loadingStats, setLoadingStats] = React.useState(false);
  const [dbStats, setDbStats] = React.useState<any>(null);
  const [matrixMode, setMatrixMode] = React.useState<'money' | 'percent'>('percent');
  const [dbStartDate, setDbStartDate] = React.useState<string>("");
  const [dbEndDate, setDbEndDate] = React.useState<string>("");
  const [dbMonth, setDbMonth] = React.useState<string>("");
  const [dbYear, setDbYear] = React.useState<string>(new Date().getFullYear().toString());
  const [dbConjunto, setDbConjunto] = React.useState<string>("Todos");
  const [conjuntos, setConjuntos] = React.useState<string[]>([]);

  const months = [
    { value: "01", label: "Enero" }, { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" }, { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" }, { value: "06", label: "Junio" },
    { value: "07", label: "Julio" }, { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" }, { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" }, { value: "12", label: "Diciembre" }
  ];

  const years = ["2024", "2025", "2026"];

  React.useEffect(() => {
    if (dbMonth && dbYear) {
      const start = `${dbYear}-${dbMonth}-01`;
      const lastDay = new Date(parseInt(dbYear), parseInt(dbMonth), 0).getDate();
      const end = `${dbYear}-${dbMonth}-${lastDay.toString().padStart(2, '0')}`;
      setDbStartDate(start);
      setDbEndDate(end);
    }
  }, [dbMonth, dbYear]);

  const fetchDbStats = React.useCallback(async () => {
    setLoadingStats(true);
    try {
      const start = dbStartDate ? new Date(dbStartDate) : null;
      const end = dbEndDate ? new Date(dbEndDate) : null;
      const res = await getInvoiceStats(start, end, dbConjunto);
      if (res.success) {
        setDbStats(res.stats);
      }
    } catch (err) {
      console.error("Dashboard Stats Error:", err);
    } finally {
      setLoadingStats(false);
    }
  }, [dbStartDate, dbEndDate, dbConjunto]);

  const loadInitialData = React.useCallback(async () => {
    const res = await getConjuntos();
    if (res.success) {
      setConjuntos(res.conjuntos || []);
    }
  }, []);

  React.useEffect(() => {
    fetchDbStats();
  }, [fetchDbStats]);

  React.useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const totalValue = advisorStats.reduce((sum, item) => sum + item.totalGenerated, 0);

  // Format the date range text
  const dateRangeText = useMemo(() => {
    if (!minDate || !maxDate) return "Sin datos";
    
    // Format options: 05/03/2026
    const formatOpts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const minStr = new Intl.DateTimeFormat('es-CO', formatOpts).format(minDate);
    const maxStr = new Intl.DateTimeFormat('es-CO', formatOpts).format(maxDate);

    if (minStr === maxStr) return minStr;
    return `${minStr} - ${maxStr}`;
  }, [minDate, maxDate]);

  return (
    <div className="max-w-[98%] mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Resumen de Gestión (Base de Datos) */}
      <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1.5 bg-emerald-500 rounded-full"></div>
            <h2 className="text-xl font-bold text-slate-800">Resumen de Gestión (Base de Datos)</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 px-3 border-l border-slate-100 ml-2">
              <CalendarDays className="w-4 h-4 text-slate-400" />
            </div>
            
            <select 
              className="text-xs font-bold bg-slate-50 border-none rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer text-slate-600"
              value={dbMonth}
              onChange={(e) => setDbMonth(e.target.value)}
            >
              <option value="">Mes...</option>
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <select 
              className="text-xs font-bold bg-slate-50 border-none rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer text-slate-600"
              value={dbYear}
              onChange={(e) => setDbYear(e.target.value)}
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <div className="h-4 w-px bg-slate-200 mx-1"></div>

            <input 
              type="date" 
              className="text-xs font-medium bg-slate-50 border-none rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
              value={dbStartDate}
              onChange={(e) => { setDbStartDate(e.target.value); setDbMonth(""); }}
            />
            <span className="text-slate-300 text-xs">—</span>
            <input 
              type="date" 
              className="text-xs font-medium bg-slate-50 border-none rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
              value={dbEndDate}
              onChange={(e) => { setDbEndDate(e.target.value); setDbMonth(""); }}
            />
            <div className="flex items-center gap-2 px-3 border-l border-slate-100 ml-2">
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <SearchableSelect 
              label="Filtrar por Conjunto"
              options={conjuntos}
              value={dbConjunto}
              onChange={(val) => setDbConjunto(val)}
            />

            {(dbStartDate || dbEndDate || dbConjunto !== "Todos" || dbMonth) && (
              <button 
                onClick={() => { setDbStartDate(""); setDbEndDate(""); setDbConjunto("Todos"); setDbMonth(""); }}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                title="Limpiar filtros"
              >
                <Clock className="w-4 h-4 rotate-180" />
              </button>
            )}
          </div>
        </div>
        
        {dbStats ? (
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 transition-opacity duration-300 ${loadingStats ? 'opacity-50' : 'opacity-100'}`}>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center group hover:border-slate-800 transition-all border-b-4 border-b-slate-800">
              <div className="p-4 bg-slate-50 text-slate-800 rounded-2xl mr-5 group-hover:scale-110 transition-transform">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Honorarios Generados</p>
                <h3 className="text-xl font-black text-slate-800">
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(dbStats.totalMetaHonorarios)}
                </h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center group hover:border-amber-200 transition-all">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl mr-5 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pendiente ({dbStats.countPendiente})</p>
                <h3 className="text-xl font-black text-slate-800">
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(dbStats.totalPendiente)}
                </h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center group hover:border-emerald-200 transition-all border-b-4 border-b-emerald-500">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl mr-5 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Recaudado ({dbStats.countPagado})</p>
                <h3 className="text-xl font-black text-emerald-600">
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(dbStats.totalPagado)}
                </h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center group hover:border-blue-200 transition-all">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl mr-5 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Días de Pago (Demora)</p>
                <h3 className="text-xl font-black text-blue-600">
                  {dbStats.avgPaymentDays || 0} <span className="text-xs font-bold text-slate-400 font-normal">días prom.</span>
                </h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center group hover:border-rose-200 transition-all">
              <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl mr-5 group-hover:scale-110 transition-transform">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Anulado ({dbStats.countAnulado})</p>
                <h3 className="text-xl font-black text-rose-600">
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(dbStats.totalAnulado)}
                </h3>
              </div>
            </div>

            {/* Panel Principal: GRÁFICO DE MESES DE GESTIÓN (LO QUE PIDIÓ LA USUARIA) */}
            {dbStats.cohortHistory && (
              <div className="md:col-span-4 bg-white rounded-3xl shadow-xl border border-slate-100 p-10 mt-6 overflow-hidden relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                       <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />
                       Rendimiento Histórico por MES DE GESTIÓN
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2 bg-slate-50 inline-block px-3 py-1 rounded-full border border-slate-100 italic">
                      Vista enfocada en Eficacia Mensual • Análisis de Cosecha
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-5 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-blue-900 rounded-full shadow-sm"></div>
                       <span className="text-[10px] font-black text-slate-600 uppercase">Mismo Mes</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                       <span className="text-[10px] font-black text-slate-600 uppercase">Recup. Posterior</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-slate-200 rounded-full shadow-sm"></div>
                       <span className="text-[10px] font-black text-slate-600 uppercase">Pendiente</span>
                    </div>
                    <div className="h-4 w-px bg-slate-200 mx-2"></div>
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 border-2 border-emerald-500 rounded-full"></div>
                       <span className="text-[10px] font-black text-emerald-600 uppercase">Eficacia %</span>
                    </div>
                  </div>
                </div>

                <div className="relative h-[450px] mt-20 px-6">
                  {/* Grid Lines con Labels de Meta */}
                  {[0, 25, 50, 75, 100].map(p => (
                    <div key={p} className="absolute w-full border-t border-slate-50 flex items-center" style={{ bottom: `${p}%` }}>
                       <span className="absolute -left-10 text-[10px] font-black text-slate-300">{p}%</span>
                    </div>
                  ))}

                  <div className="absolute inset-0 flex items-end justify-between gap-12 pt-10">
                    {dbStats.cohortHistory.length === 0 ? (
                       <div className="w-full h-full flex items-center justify-center text-slate-300 font-black uppercase tracking-widest text-sm">
                          No hay suficientes datos de meses de gestión
                       </div>
                    ) : dbStats.cohortHistory.map((c: any, idx: number) => {
                      const totalRecaudado = c.totalCollected;
                      const efficacy = c.meta > 0 ? Math.round((totalRecaudado / c.meta) * 100) : 0;
                      
                      const monthLabels: Record<string, string> = {
                        "01": "ENERO", "02": "FEBRERO", "03": "MARZO", "04": "ABRIL", "05": "MAYO", "06": "JUNIO",
                        "07": "JULIO", "08": "AGOSTO", "09": "SEPTIEMBRE", "10": "OCTUBRE", "11": "NOVIEMBRE", "12": "DICIEMBRE"
                      };
                      const [y, m] = c.month.split("-");
                      const displayMonth = monthLabels[m];

                      // Multi-Segment Calculation
                      const recoveryEntries = Object.entries(c.recoveriesByMonth as Record<string, number>)
                        .sort((a, b) => a[0].localeCompare(b[0]));
                      
                      const pendingAmount = Math.max(0, c.meta - totalRecaudado);
                      const pendingP = (pendingAmount / c.meta) * 100;

                      const segmentColors = [
                        "bg-blue-900", "bg-blue-600", "bg-blue-400", "bg-cyan-500", "bg-cyan-400", "bg-teal-400"
                      ];

                      return (
                        <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                           {/* Line Marker Eficacia */}
                           <div 
                             className="absolute left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-[6px] border-emerald-500 rounded-full z-20 shadow-lg transition-all group-hover:scale-125"
                             style={{ bottom: `${efficacy}%`, marginBottom: '-12px' }}
                           >
                              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-black px-3 py-1.5 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all z-50 scale-75 group-hover:scale-100">
                                {efficacy}% ÉXITO
                              </div>
                           </div>

                           {/* La Gran Barra Stacked */}
                           <div className="w-full max-w-[110px] h-full flex flex-col-reverse rounded-3xl overflow-hidden shadow-2xl border border-white transition-all group-hover:shadow-blue-100 group-hover:-translate-y-2 duration-500 bg-slate-50">
                              {recoveryEntries.map(([rMonth, amount], sIdx) => {
                                const p = (amount / c.meta) * 100;
                                if (p < 0.1) return null;
                                
                                const colorClass = segmentColors[Math.min(sIdx, segmentColors.length - 1)];
                                const [ry, rm] = rMonth.split("-");
                                const rMonthShort = monthLabels[rm]?.slice(0,3);

                                return (
                                  <div 
                                    key={rMonth} 
                                    className={`${colorClass} flex items-center justify-center relative transition-all duration-1000 group/segment hover:brightness-110`} 
                                    style={{ height: `${p}%` }}
                                  >
                                    {p > 8 && (
                                       <div className="flex flex-col items-center pointer-events-none drop-shadow-md">
                                          <span className="text-[12px] text-white font-black">{Math.round(p)}%</span>
                                          <span className="text-[8px] text-white/50 font-bold uppercase tracking-tighter">{rMonthShort}</span>
                                       </div>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Sección Pendiente */}
                              <div className="bg-slate-100 flex items-center justify-center relative transition-all duration-1000" style={{ height: `${pendingP}%` }}>
                                {pendingP > 15 && <span className="text-[10px] text-slate-300 font-black rotate-90 tracking-widest">{Math.round(pendingP)}% PEND</span>}
                              </div>

                              {/* Valor Meta Arriba */}
                              <div className="absolute -top-16 w-full text-center">
                                <p className="text-[16px] font-black text-slate-800 tracking-tighter drop-shadow-sm">
                                  {new Intl.NumberFormat('es-CO', { notation: 'compact' }).format(c.meta)}
                                </p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">HONORARIOS</p>
                              </div>
                           </div>

                           {/* Month Label Base */}
                           <div className="mt-12 text-center group-hover:scale-110 transition-transform">
                              <p className="text-[12px] font-black text-slate-800 tracking-tight">{displayMonth}</p>
                              <p className="text-[10px] font-bold text-slate-300">{y}</p>
                           </div>
                           
                           {/* VINTAGE TOOLTIP */}
                           <div className="absolute -top-40 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 opacity-0 group-hover:opacity-100 transition-all z-50 pointer-events-none scale-50 group-hover:scale-100 min-w-[280px]">
                              <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
                                <Calendar className="w-5 h-5 text-blue-500" />
                                <p className="text-[13px] font-black text-slate-800 uppercase tracking-tighter">Recaudo: Gestión {displayMonth}</p>
                              </div>
                              <div className="space-y-4">
                                {Object.entries(c.recoveriesByMonth as Record<string, number>)
                                  .sort((a,b) => a[0].localeCompare(b[0]))
                                  .map(([m, am]) => (
                                    <div key={m} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border-l-4 border-blue-500">
                                       <span className="text-[11px] font-bold text-slate-500 uppercase">{monthLabels[m.split("-")[1]]}:</span>
                                       <span className="text-[12px] font-black text-blue-900">{new Intl.NumberFormat('es-CO').format(am)}</span>
                                    </div>
                                  ))}
                                <div className="flex justify-between items-center border-t border-slate-100 pt-4 px-2">
                                   <span className="text-[11px] font-black text-slate-400 uppercase">Sin recaudar:</span>
                                   <span className="text-[13px] font-black text-rose-500">{new Intl.NumberFormat('es-CO').format(c.meta - totalRecaudado)}</span>
                                </div>
                              </div>
                           </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* MATRIZ VINTAGE: LA REJILLA DE CALOR (COMO EL EXCEL) */}
            {dbStats.cohortHistory && dbStats.cohortHistory.length > 0 && (
              <div className="md:col-span-4 bg-white rounded-3xl shadow-xl border border-slate-100 p-8 mt-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                       <FileSpreadsheet className="w-6 h-6 text-indigo-500" />
                       Matriz de Maduración de Cartera (Vintage)
                    </h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Análisis de flujo de caja por mes relativo de recaudo</p>
                  </div>

                  {/* SELECTOR DE MODO: PLATA VS PORCENTAJE */}
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                    <button 
                      onClick={() => setMatrixMode('money')}
                      className={`px-6 py-2.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-2 ${matrixMode === 'money' ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <Scale className="w-3 h-3" /> VER EN PESOS ($)
                    </button>
                    <button 
                      onClick={() => setMatrixMode('percent')}
                      className={`px-6 py-2.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-2 ${matrixMode === 'percent' ? 'bg-white text-rose-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <TrendingUp className="w-3 h-3" /> VER EN PORCENTAJE (%)
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-3xl border border-slate-100 shadow-inner scrollbar-hide">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100">
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100/30 sticky left-0 z-10 backdrop-blur-sm">Año</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100/30 sticky left-[100px] z-10 backdrop-blur-sm">Mes</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 text-center">Cuentas</th>
                        {[1,2,3,4,5,6].map(m => (
                          <th key={m} className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">MES {m}</th>
                        ))}
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 text-center border-l border-slate-100 italic">Pend.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbStats.cohortHistory.map((c: any, ridx: number) => {
                        const [y, m] = c.month.split("-");
                        const monthLabels: Record<string, string> = {
                          "01": "ENERO", "02": "FEBRERO", "03": "MARZO", "04": "ABRIL", "05": "MAYO", "06": "JUNIO",
                          "07": "JULIO", "08": "AGOSTO", "09": "SEPTIEMBRE", "10": "OCTUBRE", "11": "NOVIEMBRE", "12": "DICIEMBRE"
                        };
                        
                        const recoveries = c.recoveriesByMonth as Record<string, number>;
                        const totalRecaudado = c.totalCollected;
                        const pendingAmount = Math.max(0, c.meta - totalRecaudado);

                        return (
                          <tr key={ridx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                            <td className="p-5 text-[11px] font-black text-slate-400 group-hover:text-slate-600 sticky left-0 bg-white z-10 group-hover:bg-slate-50 transition-colors">{y}</td>
                            <td className="p-5 text-[11px] font-black text-slate-800 sticky left-[100px] bg-white z-10 group-hover:bg-slate-50 transition-colors">{monthLabels[m]}</td>
                            <td className="p-5 text-[11px] font-bold text-slate-400 text-center border-r border-slate-50">{c.count}</td>
                            
                            {[0,1,2,3,4,5].map(offset => {
                              // Calculate payment month key
                              const d = new Date(parseInt(y), parseInt(m) - 1 + offset, 1);
                              const pKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                              const amount = recoveries[pKey] || 0;
                              const p = c.meta > 0 ? (amount / c.meta) * 100 : 0;
                              
                              // Heatmap scale
                              let heatColor = "";
                              const isMoney = matrixMode === 'money';
                              
                              if (p > 30) heatColor = isMoney ? "bg-blue-600 text-white" : "bg-rose-600 text-white";
                              else if (p > 15) heatColor = isMoney ? "bg-blue-400 text-white" : "bg-rose-400 text-white";
                              else if (p > 5) heatColor = isMoney ? "bg-blue-100 text-blue-800" : "bg-rose-50 text-rose-800";
                              else if (p > 0) heatColor = isMoney ? "bg-blue-50 text-blue-600" : "bg-rose-50/50 text-rose-600";
                              else heatColor = "text-slate-200";

                              return (
                                <td key={offset} className={`p-4 text-[10px] font-black text-center transition-all ${heatColor} border border-white/40 shadow-sm`}>
                                   {amount > 0 ? (
                                      matrixMode === 'money' ? 
                                        new Intl.NumberFormat('es-CO', { notation: 'compact' }).format(amount) : 
                                        `${p.toFixed(1)}%`
                                   ) : "-"}
                                </td>
                              );
                            })}

                            <td className="p-5 text-[10px] font-black text-center bg-slate-50/50 text-slate-300 italic border-l border-slate-100">
                               {matrixMode === 'money' ? 
                                 new Intl.NumberFormat('es-CO', { notation: 'compact' }).format(pendingAmount) : 
                                 `${((pendingAmount / c.meta) * 100).toFixed(1)}%`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        )}
      </div>

      {/* Title for Session Stats */}
      <div className="flex items-center gap-2 mb-4 mt-12">
        <div className="h-8 w-1.5 bg-blue-500 rounded-full"></div>
        <h2 className="text-xl font-bold text-slate-800">Estadísticas de Sesión (Archivos)</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mr-4 flex-shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Archivos Cargados</p>
              <h3 className="text-xl font-bold text-slate-800">{filesData.length}</h3>
            </div>
          </div>
          <Link href="/dashboard/upload" className="text-blue-600 text-sm font-medium hover:underline flex items-center">
            Gestionar archivos <ExternalLink className="w-3 h-3 ml-1" />
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg mr-4 flex-shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cuentas Proyectadas</p>
              <h3 className="text-xl font-bold text-slate-800">{mappedRecords.length}</h3>
            </div>
          </div>
          {mappedRecords.length > 0 && (
            <Link href="/dashboard/validate" className="text-emerald-600 text-sm font-medium hover:underline flex items-center">
              Ir a validación <ExternalLink className="w-3 h-3 ml-1" />
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg mr-4 flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Honorarios (Sesión)</p>
              <h3 className="text-xl sm:text-2xl lg:text-lg xl:text-xl font-bold text-slate-800">
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalValue)}
              </h3>
            </div>
          </div>
        </div>

        {/* New Date Range Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg mr-4 flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rango Pendiente</p>
              <h3 className="text-[14px] sm:text-[16px] lg:text-[13px] xl:text-[15px] mt-1 font-bold text-slate-800 leading-tight">
                {dateRangeText}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Advisor Stats Table */}
      {advisorStats.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800">Resumen por Asesor</h3>
            <p className="text-sm text-slate-500">Total de registros y montos detectados en los archivos por asesor.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 font-semibold">
                <tr>
                  <th className="px-6 py-4">Asesor</th>
                  <th className="px-6 py-4 text-center">Cant. de Cuentas</th>
                  <th className="px-6 py-4 text-right">Honorarios</th>
                  <th className="px-6 py-4 text-right">% del Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {advisorStats.map((stat, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">{stat.name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full">
                        {stat.count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(stat.totalGenerated)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-500">
                      {totalValue > 0 ? ((stat.totalGenerated / totalValue) * 100).toFixed(1) + '%' : '0%'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No hay datos de asesores</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            Carga uno o más archivos de Excel para visualizar el consolidado acumulado por asesor.
          </p>
          <button 
            onClick={() => router.push("/dashboard/upload")} 
            className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
          >
            Cargar Datos
          </button>
        </div>
      )}

      {/* Month Stats Table */}
      {monthStats.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800 flex items-center">
              <CalendarDays className="w-5 h-5 mr-2 text-indigo-600" />
              Resumen por Mes
            </h3>
            <p className="text-sm text-slate-500">Consolidado de cuentas y valores proyectados según el mes de pago.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 font-semibold">
                <tr>
                  <th className="px-6 py-4">Mes</th>
                  <th className="px-6 py-4 text-center">Cant. de Cuentas</th>
                  <th className="px-6 py-4 text-right">Honorarios Proyectados</th>
                  <th className="px-6 py-4 text-center">Cumplimiento Política</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {monthStats.map((stat, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">{stat.month}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full">
                        {stat.count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(stat.totalGenerated)}
                    </td>
                    <td className="px-6 py-4 text-center">
                       {stat.count > 0 ? (
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                           (stat.onTimeCount / stat.count) >= 0.9 ? 'bg-emerald-100 text-emerald-800' : 
                           (stat.onTimeCount / stat.count) >= 0.7 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                         }`}>
                           {Math.round((stat.onTimeCount / stat.count) * 100)}% a tiempo
                         </span>
                       ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col items-center gap-2 opacity-30">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          EMDECOB Dashboard v2.1.0
        </div>
        <div className="text-[9px] font-medium text-slate-300">
          Build: 2026-04-13 | Commit Ident: ec4d187
        </div>
      </div>
    </div>
  );
}
