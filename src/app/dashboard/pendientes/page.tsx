"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getPendingInvoices } from "@/app/actions/invoice";
import { ArrowLeft, Clock, Building2, ListChecks, Percent } from "lucide-react";

export default function PendientesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string>("total_desc"); // Default: Mayor a Menor

  useEffect(() => {
    async function load() {
      try {
        const userPortafolio = localStorage.getItem('userPortafolio') || 'Todos';
        const res = await getPendingInvoices(userPortafolio);
        if (res.success) {
          setInvoices(res.invoices || []);
        } else {
          setError(res.error || "Error al cargar las cuentas pendientes.");
        }
      } catch (err: any) {
        setError(err.message || "Fallo de conexión.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  const getMonthName = (m: number | null) => {
    if (!m) return 'N/A';
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return months[m - 1] || 'N/A';
  };

  // Calcular el Total Pendiente NETO (Suma de honorariosTotal sin IVA)
  const totalPendingNeto = useMemo(() => {
    return invoices.reduce((acc, inv) => acc + (inv.honorariosTotal || 0), 0);
  }, [invoices]);

  const sortedInvoices = useMemo(() => {
    const list = [...invoices];
    if (sortKey === 'total_desc' || sortKey === 'pct_desc') {
      return list.sort((a, b) => (b.honorariosTotal || 0) - (a.honorariosTotal || 0));
    }
    if (sortKey === 'total_asc' || sortKey === 'pct_asc') {
      return list.sort((a, b) => (a.honorariosTotal || 0) - (b.honorariosTotal || 0));
    }
    if (sortKey === 'gestion') {
      return list.sort((a, b) => {
        const valA = (a.gestionAnio || 0) * 100 + (a.gestionMes || 0);
        const valB = (b.gestionAnio || 0) * 100 + (b.gestionMes || 0);
        return valB - valA;
      });
    }
    if (sortKey === 'generacion') {
      return list.sort((a, b) => {
        const valA = (a.generacionAnio || 0) * 100 + (a.generacionMes || 0);
        const valB = (b.generacionAnio || 0) * 100 + (b.generacionMes || 0);
        return valB - valA;
      });
    }
    if (sortKey === 'consecutivo_asc') {
      return list.sort((a, b) => (a.consecutivo || '').localeCompare(b.consecutivo || ''));
    }
    return list.sort((a, b) => (b.consecutivo || '').localeCompare(a.consecutivo || ''));
  }, [invoices, sortKey]);

  const toggleSort = (key: string) => {
    if (key === 'total' || key === 'pct') {
      setSortKey(prev => prev === 'total_desc' ? 'total_asc' : 'total_desc');
    } else if (key === 'gestion') {
      setSortKey(prev => prev === 'gestion' ? 'total_desc' : 'gestion');
    } else if (key === 'generacion') {
      setSortKey(prev => prev === 'generacion' ? 'total_desc' : 'generacion');
    } else if (key === 'consecutivo') {
      setSortKey(prev => prev === 'consecutivo_desc' ? 'consecutivo_asc' : 'consecutivo_desc');
    }
  };

  return (
    <div className="max-w-[98%] mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/dashboard")}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
            title="Volver al Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-1.5 bg-amber-500 rounded-full"></div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Cuentas de Cobro Pendientes</h1>
            </div>
            <p className="text-slate-500 text-sm mt-1">Listado detallado con porcentaje de participación sobre el total pendiente (Neto)</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="text-xs font-bold border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-700 shadow-sm cursor-pointer"
          >
            <option value="total_desc">Ordenar: Mayor a Menor (Valor Neto)</option>
            <option value="pct_desc">Ordenar: % Participación (Mayor a Menor)</option>
            <option value="total_asc">Ordenar: Menor a Mayor (Valor Neto)</option>
            <option value="gestion">Ordenar: Mes de Gestión</option>
            <option value="generacion">Ordenar: Mes de Generación</option>
            <option value="consecutivo_desc">Ordenar: Consecutivo (Descendente)</option>
            <option value="consecutivo_asc">Ordenar: Consecutivo (Ascendente)</option>
          </select>

          <div className="bg-amber-50 text-amber-900 border border-amber-200/60 rounded-2xl px-5 py-2.5 flex items-center gap-3 shadow-sm">
            <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
            <div>
              <div className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Pendiente (Neto)</div>
              <div className="text-base font-black flex items-baseline gap-2">
                <span>{formatCurrency(totalPendingNeto)}</span>
                <span className="text-xs text-amber-700 font-semibold">({sortedInvoices.length} cuentas)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col justify-center items-center text-slate-500 gap-4">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-semibold">Cargando cuentas pendientes...</span>
          </div>
        ) : error ? (
          <div className="p-20 text-center">
            <p className="text-red-500 font-bold">{error}</p>
          </div>
        ) : sortedInvoices.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner">
              <ListChecks className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">¡Al día!</h3>
            <p className="text-slate-400 text-sm max-w-xs">No hay cuentas de cobro con saldo pendiente en este momento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest select-none">
                  <th 
                    onClick={() => toggleSort('consecutivo')}
                    className="px-6 py-4.5 cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    title="Clic para ordenar por Consecutivo"
                  >
                    Consecutivo {sortKey.includes('consecutivo') && (sortKey === 'consecutivo_desc' ? '↓' : '↑')}
                  </th>
                  <th className="px-6 py-4.5">Conjunto / Entidad</th>
                  <th 
                    onClick={() => toggleSort('gestion')}
                    className="px-6 py-4.5 cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    title="Clic para ordenar por Mes de Gestión"
                  >
                    Mes Gestión {sortKey === 'gestion' && '↓'}
                  </th>
                  <th 
                    onClick={() => toggleSort('generacion')}
                    className="px-6 py-4.5 cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    title="Clic para ordenar por Mes de Generación"
                  >
                    Mes Generación {sortKey === 'generacion' && '↓'}
                  </th>
                  <th 
                    onClick={() => toggleSort('total')}
                    className="px-6 py-4.5 text-right cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    title="Clic para ordenar por Valor Neto"
                  >
                    Valor Neto {sortKey.includes('total') && (sortKey === 'total_desc' ? '↓' : '↑')}
                  </th>
                  <th className="px-6 py-4.5 text-right">IVA</th>
                  <th className="px-6 py-4.5 text-right">Total a Pagar</th>
                  <th 
                    onClick={() => toggleSort('pct')}
                    className="px-6 py-4.5 text-right cursor-pointer hover:bg-slate-100 hover:text-amber-700 transition-colors whitespace-nowrap"
                    title="Porcentaje de participación sobre el valor neto pendiente total"
                  >
                    % Participación {sortKey.includes('pct') && (sortKey === 'pct_desc' ? '↓' : '↑')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px]">
                {sortedInvoices.map((inv) => {
                  const pct = totalPendingNeto > 0 ? ((inv.honorariosTotal || 0) / totalPendingNeto) * 100 : 0;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">
                        {inv.consecutivo}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          {inv.conjuntoNombre}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {inv.gestionMes ? `${getMonthName(inv.gestionMes)} ${inv.gestionAnio || ''}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {inv.generacionMes ? `${getMonthName(inv.generacionMes)} ${inv.generacionAnio || ''}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-800">
                        {formatCurrency(inv.honorariosTotal)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-500 text-xs">
                        {formatCurrency(inv.ivaTotal)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-700">
                        {formatCurrency(inv.granTotal)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1 font-bold text-xs text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg shadow-2xs">
                          <Percent className="w-3 h-3 text-amber-500" />
                          {pct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
