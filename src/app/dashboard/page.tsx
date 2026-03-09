"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { getAdvisorStats, getMonthStats, getDateRangeStats } from "@/lib/stats";
import { groupRecords } from "@/lib/mapper";
import { Users, FileSpreadsheet, Building2, ExternalLink, CalendarDays, Clock } from "lucide-react";
import Link from "next/link";

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
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard General</h1>
        <p className="text-slate-500 mt-2">
          Resumen de las gestiones y cuentas de cobro cargadas en sesión.
        </p>
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
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Gestionado</p>
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
                  <th className="px-6 py-4 text-right">Valor Generado</th>
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
                  <th className="px-6 py-4 text-right">Valor Proyectado</th>
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
