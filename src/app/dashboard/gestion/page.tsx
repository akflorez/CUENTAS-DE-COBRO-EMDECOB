"use client";

import React, { useEffect, useState } from "react";
import { getInvoices, updateInvoiceStatus, getConjuntos } from "@/app/actions/invoice";
import { ListChecks, Clock, CheckCircle2, AlertCircle, Building2, ChevronLeft, ChevronRight, Search } from "lucide-react";

export default function GestionPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dbConjunto, setDbConjunto] = useState("Todos");
  const [conjuntos, setConjuntos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, conjRes] = await Promise.all([
        getInvoices(page, 20, dbConjunto),
        getConjuntos()
      ]);
      
      if (invRes.success) {
        setInvoices(invRes.invoices || []);
        setTotalPages(invRes.totalPages || 1);
        setTotalCount(invRes.totalCount || 0);
      } else {
        setError(invRes.error || "Error cargando facturas.");
      }

      if (conjRes.success) {
        setConjuntos(conjRes.conjuntos || []);
      }
    } catch (err: any) {
      setError("Error crítico: " + (err.message || "Conexión fallida"));
      console.error(err);
    }
    setLoading(false);
  }, [page, dbConjunto]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setSavingId(id);
    const invoice = invoices.find(i => i.id === id);
    const newFechaPago = newStatus === 'PAGADA' ? new Date() : null;
    const newMontoPagado = newStatus === 'PAGADA' ? (invoice.montoPagado || invoice.granTotal) : 0;
    
    const res = await updateInvoiceStatus(id, newStatus, newFechaPago, invoice.validadoTesoreria, newMontoPagado);
    if (res.success) {
      setInvoices(invoices.map(i => i.id === id ? { ...i, status: newStatus, fechaPago: newFechaPago, montoPagado: newMontoPagado } : i));
    }
    setSavingId(null);
  };

  const handleMontoChange = async (id: string, val: string) => {
    const numericVal = parseFloat(val) || 0;
    const invoice = invoices.find(i => i.id === id);
    if (!invoice) return;

    setSavingId(id);
    const res = await updateInvoiceStatus(id, invoice.status, invoice.fechaPago, invoice.validadoTesoreria, numericVal);
    if (res.success) {
      setInvoices(invoices.map(i => i.id === id ? { ...i, montoPagado: numericVal } : i));
    }
    setSavingId(null);
  };

  const handleAnular = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas anular esta cuenta de cobro?')) return;
    
    setSavingId(id);
    const res = await updateInvoiceStatus(id, 'ANULADA', null, false, 0);
    if (res.success) {
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'ANULADA', fechaPago: null, validadoTesoreria: false, montoPagado: 0 } : i));
    }
    setSavingId(null);
  };

  const handleValidadoChange = async (id: string, newValidado: boolean) => {
    setSavingId(id);
    const invoice = invoices.find(i => i.id === id);
    
    const res = await updateInvoiceStatus(id, invoice.status, invoice.fechaPago, newValidado, invoice.montoPagado, invoice.observacion);
    if (res.success) {
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, validadoTesoreria: newValidado } : i));
    }
    setSavingId(null);
  };

  const handleFechaPagoChange = async (id: string, fecha: string) => {
    setSavingId(id);
    const invoice = invoices.find(i => i.id === id);
    const parsedDate = fecha ? new Date(fecha) : null;
    const res = await updateInvoiceStatus(id, invoice.status, parsedDate, invoice.validadoTesoreria, invoice.montoPagado, invoice.observacion);
    if (res.success) {
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, fechaPago: parsedDate } : i));
    }
    setSavingId(null);
  };

  const handleObservacionLocalChange = (id: string, obs: string) => {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, observacion: obs } : i));
  };

  const handleObservacionSave = async (id: string) => {
    const invoice = invoices.find(i => i.id === id);
    if (!invoice) return;
    
    setSavingId(id);
    const res = await updateInvoiceStatus(id, invoice.status, invoice.fechaPago, invoice.validadoTesoreria, invoice.montoPagado, invoice.observacion);
    if (res.success) {
      // Sincronizar localmente si es necesario, aunque ya se hizo en onChange
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, observacion: invoice.observacion } : i));
    }
    setSavingId(null);
  };

  return (
    <div className="max-w-[98%] mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Gestión de Recaudos</h1>
            <p className="text-slate-500 mt-2 flex items-center">
              <ListChecks className="w-4 h-4 mr-2" />
              Administra el estado de pago y validación de las cuentas generadas
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-3">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filtrar por Conjunto:</span>
            </div>
            <select 
              className="text-xs font-bold bg-slate-50 border-none rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer text-slate-700"
              value={dbConjunto}
              onChange={(e) => { setDbConjunto(e.target.value); setPage(1); }}
            >
              <option value="Todos">Todos los Conjuntos</option>
              {conjuntos.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {dbConjunto !== "Todos" && (
              <button 
                onClick={() => { setDbConjunto("Todos"); setPage(1); }}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Clock className="w-4 h-4 rotate-180" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center text-slate-500">
            <svg className="animate-spin h-8 w-8 text-emerald-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cargando registros...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500 bg-rose-50/50">
            <AlertCircle className="w-12 h-12 text-rose-300 mb-3 mx-auto" />
            <p className="font-bold">Error al cargar datos</p>
            <p className="text-sm mt-1">{error}</p>
            <button 
              onClick={() => loadData()}
              className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-lg text-xs font-bold hover:bg-rose-600 transition-all"
            >
              Reintentar
            </button>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <AlertCircle className="w-12 h-12 text-slate-300 mb-3 mx-auto" />
            <p>No hay cuentas de cobro registradas aún.</p>
            <p className="text-sm mt-1">Genera PDFs desde el módulo de Vista Previa para que aparezcan aquí.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4 font-semibold">Conse.</th>
                  <th className="px-5 py-4 font-semibold">Conjunto</th>
                  <th className="px-5 py-4 font-semibold">Total</th>
                  <th className="px-5 py-4 font-semibold text-center">Estado Pago</th>
                  <th className="px-5 py-4 font-semibold text-center">Monto Recaudado</th>
                  <th className="px-5 py-4 font-semibold text-center">Validación</th>
          <th className="px-5 py-4 font-semibold text-center">Fecha Pago</th>
          <th className="px-5 py-4 font-semibold text-center">Observación</th>
                  <th className="px-5 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 min-h-[300px]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className={`hover:bg-slate-50 transition-colors ${savingId === inv.id ? 'opacity-50' : ''} ${inv.status === 'ANULADA' ? 'bg-slate-50 opacity-60' : ''}`}>
                    <td className="px-5 py-4 font-medium text-slate-700 whitespace-nowrap">
                      {inv.consecutivo}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-800">{inv.conjuntoNombre}</div>
                      <div className="text-[10px] text-slate-500">{inv.items?.length || 0} items</div>
                    </td>
                    <td className="px-5 py-4 font-bold text-emerald-700 whitespace-nowrap">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(inv.granTotal)}
                    </td>
                    
                    {/* ESTADO PAGO */}
                    <td className="px-5 py-4 text-center">
                      <select 
                        value={inv.status}
                        onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                        disabled={savingId === inv.id}
                        className={`text-xs font-bold rounded-full px-3 py-1 outline-none cursor-pointer border ${
                          inv.status === 'PAGADA' 
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                            : inv.status === 'ANULADA'
                            ? 'bg-rose-100 text-rose-700 border-rose-200'
                            : 'bg-amber-100 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="PENDIENTE">PENDIENTE</option>
                        <option value="PAGADA">PAGADA</option>
                        <option value="ANULADA">ANULADA</option>
                      </select>
                    </td>

                    {/* MONTO RECAUDADO */}
                    <td className="px-5 py-4 text-center">
                      {inv.status !== 'ANULADA' ? (
                        <div className="flex items-center justify-center">
                          <span className="text-xs mr-1 text-slate-400">$</span>
                          <input 
                            type="number"
                            className="w-24 text-right text-xs font-bold bg-white border border-slate-200 rounded px-2 py-1 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                            value={inv.montoPagado || 0}
                            onChange={(e) => handleMontoChange(inv.id, e.target.value)}
                            onBlur={(e) => handleMontoChange(inv.id, e.target.value)}
                            disabled={savingId === inv.id}
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-bold opacity-30">$ 0</span>
                      )}
                    </td>
                    
                    {/* TESORERIA */}
                    <td className="px-5 py-4 text-center">
                       <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={inv.validadoTesoreria}
                          onChange={(e) => handleValidadoChange(inv.id, e.target.checked)}
                          disabled={savingId === inv.id || inv.status === 'ANULADA'}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </td>
                      <td className="px-5 py-4 text-center">
                        <input
                          type="date"
                          className="bg-white border border-slate-300 rounded px-2 py-1 text-sm"
                          value={inv.fechaPago ? new Date(inv.fechaPago).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleFechaPagoChange(inv.id, e.target.value)}
                          disabled={savingId === inv.id}
                        />
                      </td>
                      <td className="px-5 py-4 text-center min-w-[250px]">
                        <textarea
                          className="bg-white border border-slate-300 rounded px-3 py-2 text-xs w-full min-h-[80px] shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-y font-medium text-slate-700"
                          value={inv.observacion || ''}
                          onChange={(e) => handleObservacionLocalChange(inv.id, e.target.value)}
                          onBlur={() => handleObservacionSave(inv.id)}
                          placeholder="Agregar nota de recaudo..."
                          disabled={savingId === inv.id}
                        />
                      </td>

                    {/* ACCIONES */}
                    <td className="px-5 py-4 text-right">
                      {inv.status !== 'ANULADA' && (
                        <button 
                          onClick={() => handleAnular(inv.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors title='Anular Cuenta'"
                        >
                          <AlertCircle className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* PAGINACIÓN */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500 font-medium">
                Mostrando <span className="font-bold text-slate-800">{invoices.length}</span> de <span className="font-bold text-slate-800">{totalCount}</span> registros
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = page;
                    if (totalPages > 5) {
                      if (page <= 3) pageNum = i + 1;
                      else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = page - 2 + i;
                    } else {
                      pageNum = i + 1;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          page === pageNum 
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                            : 'hover:bg-white border border-transparent hover:border-slate-200 text-slate-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="text-xs text-slate-400 font-medium">
                Página {page} de {totalPages}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
