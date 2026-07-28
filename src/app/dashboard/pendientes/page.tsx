"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPendingInvoices } from "@/app/actions/invoice";
import { ArrowLeft, Clock, Building2, ListChecks } from "lucide-react";

export default function PendientesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="max-w-[98%] mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
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
            <p className="text-slate-500 text-sm mt-1">Listado detallado de todas las obligaciones pendientes de cobro</p>
          </div>
        </div>
        
        <div className="bg-amber-50 text-amber-800 border border-amber-100 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm">
          <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
          <div>
            <div className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Total Pendientes</div>
            <div className="text-lg font-black">{invoices.length} cuentas</div>
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
        ) : invoices.length === 0 ? (
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
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4.5">Consecutivo</th>
                  <th className="px-6 py-4.5">Conjunto / Entidad</th>
                  <th className="px-6 py-4.5">Mes Gestión</th>
                  <th className="px-6 py-4.5">Mes Generación</th>
                  <th className="px-6 py-4.5 text-right">Valor Neto</th>
                  <th className="px-6 py-4.5 text-right">IVA</th>
                  <th className="px-6 py-4.5 text-right">Total a Pagar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px]">
                {invoices.map((inv) => (
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
                    <td className="px-6 py-4 text-right font-semibold text-slate-600">
                      {formatCurrency(inv.honorariosTotal)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-500 text-xs">
                      {formatCurrency(inv.ivaTotal)}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-emerald-700">
                      {formatCurrency(inv.granTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
