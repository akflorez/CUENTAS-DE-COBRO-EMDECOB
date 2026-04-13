"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { getAdvisorStats, getMonthStats, getDateRangeStats } from "@/lib/stats";
import { groupRecords } from "@/lib/mapper";
import { Users, FileSpreadsheet, Building2, ExternalLink, CalendarDays, Clock, CheckCircle2, AlertCircle, Scale } from "lucide-react";
import Link from "next/link";
import { getInvoiceStats, getConjuntos } from "@/app/actions/invoice";
import { TrendingUp, BarChart3, Timer } from "lucide-react";

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
  
  const [dbStats, setDbStats] = React.useState<any>(null);
  const [dbStartDate, setDbStartDate] = React.useState<string>("");
  const [dbEndDate, setDbEndDate] = React.useState<string>("");
  const [dbMonth, setDbMonth] = React.useState<string>("");
  const [dbYear, setDbYear] = React.useState<string>(new Date().getFullYear().toString());
  const [dbConjunto, setDbConjunto] = React.useState<string>("Todos");
  const [conjuntos, setConjuntos] = React.useState<string[]>([]);
  const [loadingStats, setLoadingStats] = React.useState(false);

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
            <select 
              className="text-xs font-bold bg-slate-50 border-none rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer text-slate-600"
              value={dbConjunto}
              onChange={(e) => setDbConjunto(e.target.value)}
            >
              <option value="Todos text-slate-400">Todos los Conjuntos</option>
              {conjuntos.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

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
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">CUMPLIMIENTO (DÍA 10)</p>
                <h3 className="text-xl font-black text-blue-600">
                  {dbStats.complianceRate || 0}% <span className="text-xs font-bold text-slate-400 font-normal">a tiempo</span>
                </h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center group hover:border-purple-200 transition-all">
              <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl mr-5 group-hover:scale-110 transition-transform">
                <Timer className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">LAG ENTRADA DINERO</p>
                <h3 className="text-xl font-black text-purple-600">
                  {dbStats.avgMoneyLagDays || 0} <span className="text-xs font-bold text-slate-400 font-normal">días</span>
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

            {/* Gráfico de Tendencia Simple */}
            {dbStats.trends && dbStats.trends.length > 0 && (
              <div className="md:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                       <BarChart3 className="w-5 h-5 text-emerald-500" />
                       Tendencia de Gestión (Últimos 15 días)
                    </h3>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Comparativa de Cuentas Generadas vs Recaudos Reales</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-slate-100 rounded-sm"></div>
                       <span className="text-[10px] font-bold text-slate-500">GENERADO</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                       <span className="text-[10px] font-bold text-slate-500">RECAUDADO</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-between h-48 gap-2 px-2 border-b border-slate-100">
                   {dbStats.trends.map((t: any, idx: number) => {
                     const maxVal = Math.max(...dbStats.trends.map((x: any) => x.generated), 1);
                     const genHeight = (t.generated / maxVal) * 100;
                     const collHeight = (t.collected / maxVal) * 100;
                     
                     return (
                       <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative cursor-default h-full">
                          {/* Tooltip */}
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-xl pointer-events-none font-bold">
                             {new Date(t.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}<br/>
                             G: {new Intl.NumberFormat('es-CO').format(t.generated)}<br/>
                             R: {new Intl.NumberFormat('es-CO').format(t.collected)}
                          </div>
                          
                          <div className="w-full max-w-[20px] flex items-end gap-[2px] h-full justify-center">
                             <div 
                               className="w-full bg-slate-100 rounded-t-sm transition-all duration-500 group-hover:bg-slate-200" 
                               style={{ height: `${genHeight}%` }}
                             ></div>
                             <div 
                               className="w-full bg-emerald-500 rounded-t-sm transition-all duration-500 shadow-[0_-4px_10px_rgba(16,185,129,0.2)] group-hover:bg-emerald-600" 
                               style={{ height: `${collHeight}%` }}
                             ></div>
                          </div>
                          <div className="mt-2 text-[9px] font-bold text-slate-400 rotate-45 origin-left whitespace-nowrap hidden md:block">
                            {new Date(t.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                          </div>
                       </div>
                     )
                   })}
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
    </div>
  );
}
