"use client";

import React, { useEffect, useState, useRef } from "react";
import { getInvoices, updateInvoiceStatus, getConjuntos, updateInvoiceMetadata, addPayment, deletePayment, deleteInvoice, deleteInvoicesByFilter } from "@/app/actions/invoice";
import { ListChecks, Clock, CheckCircle2, AlertCircle, Building2, ChevronLeft, ChevronRight, Search, X, Download, FileText, FileArchive, FileSpreadsheet, Trash2 } from "lucide-react";
import SearchableSelect from "@/components/SearchableSelect";
import { downloadPdf, downloadPdfsAsZip } from "@/lib/pdfGenerator";
import { InvoiceTemplate } from "@/components/InvoiceTemplate";
import * as XLSX from "xlsx";

export default function GestionPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dbConjunto, setDbConjunto] = useState("Todos");
  const [dbPortafolio, setDbPortafolio] = useState("Todos");
  const [conjuntos, setConjuntos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filterGenMes, setFilterGenMes] = useState(0); // 0 = Todos
  const [filterGenAnio, setFilterGenAnio] = useState(0); // 0 = Todos
  const [overrideFechaPdf, setOverrideFechaPdf] = useState("");
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const templateRef = useRef<HTMLDivElement>(null);
  const [currentInvoiceForPdf, setCurrentInvoiceForPdf] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchValor, setSearchValor] = useState("");
  const [debouncedValor, setDebouncedValor] = useState("");

  const [selectedInvoiceForPayments, setSelectedInvoiceForPayments] = useState<any | null>(null);
  const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false);
  const [newPaymentMonto, setNewPaymentMonto] = useState("");
  const [newPaymentTipo, setNewPaymentTipo] = useState("RECAUDO");
  const [newPaymentFecha, setNewPaymentFecha] = useState(new Date().toISOString().split('T')[0]);
  const [newPaymentMetodo, setNewPaymentMetodo] = useState("Transferencia");
  const [newPaymentObs, setNewPaymentObs] = useState("");
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValor(searchValor);
      setPage(1);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchValor]);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, conjRes] = await Promise.all([
        getInvoices(page, 20, dbConjunto, filterGenMes, filterGenAnio, debouncedSearch, debouncedValor, dbPortafolio),
        getConjuntos(dbPortafolio)
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
  }, [page, dbConjunto, filterGenMes, filterGenAnio, debouncedSearch, debouncedValor, dbPortafolio]);

  useEffect(() => {
    loadData();
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('currentUser');
      const userPortafolio = localStorage.getItem('userPortafolio') || 'Todos';
      // Solo EMDECOB es admin (puede editar/eliminar y ve todo)
      setIsAdmin(user === 'EMDECOB');
      // Bloquear portafolio para usuarios restringidos
      if (user !== 'EMDECOB' && user !== 'TESORERIA' && userPortafolio !== 'Todos') {
        setDbPortafolio(userPortafolio);
      }
    }
  }, [loadData]);

  const handleMetadataChange = async (
    id: string, 
    gestionMes: number, 
    gestionAnio: number, 
    generacionMes: number, 
    generacionAnio: number, 
    fechaElaboracion: string | null,
    consecutivo?: string
  ) => {
    setSavingId(id);
    const parsedFecha = fechaElaboracion ? new Date(fechaElaboracion) : null;
    const res = await updateInvoiceMetadata(id, gestionMes, gestionAnio, generacionMes, generacionAnio, parsedFecha, consecutivo);
    if (res.success) {
      setInvoices(invoices.map(i => i.id === id ? { 
        ...i, 
        gestionMes, 
        gestionAnio, 
        generacionMes, 
        generacionAnio, 
        fechaElaboracion: parsedFecha,
        consecutivo: consecutivo || i.consecutivo
      } : i));
    } else {
      alert(res.error || "Error al actualizar metadatos");
    }
    setSavingId(null);
  };
   const handleDownloadPdf = async (invoice: any) => {
     setIsDownloading(invoice.id);
     
     // Aplicar override de fecha si existe (usando T12:00:00 para evitar problemas de timezone)
     const invoiceWithOverride = overrideFechaPdf 
       ? { ...invoice, fechaElaboracion: new Date(overrideFechaPdf + 'T12:00:00') } 
       : invoice;

     setCurrentInvoiceForPdf(invoiceWithOverride);
     
     // Pequeño delay para que React renderice el template oculto
     setTimeout(async () => {
       if (templateRef.current) {
         try {
           const fileName = `${invoice.consecutivo}_${invoice.conjuntoNombre}.pdf`.replace(/[^a-zA-Z0-9_.-]/g, '_');
           await downloadPdf(templateRef.current, fileName, 'letter', 'portrait');
         } catch (err) {
           console.error("Error generating PDF:", err);
           alert("Error al generar el PDF");
         }
       }
       setIsDownloading(null);
     }, 500);
   };

   const handleDownloadBulkZip = async () => {
     setIsDownloading("BULK");
     try {
       // Obtener todos los registros del filtro actual (sin paginación, o página muy grande)
       const res = await getInvoices(1, 1000, dbConjunto, filterGenMes, filterGenAnio, debouncedSearch, debouncedValor);
       if (!res.success) throw new Error(res.error);
       
       let allInvoices = res.invoices;
       if (allInvoices.length === 0) {
         alert("No hay registros para descargar en este filtro.");
         setIsDownloading(null);
         return;
       }

       // Aplicar override de fecha a todo el lote si existe
       if (overrideFechaPdf) {
         allInvoices = allInvoices.map((inv: any) => ({
           ...inv,
           fechaElaboracion: new Date(overrideFechaPdf + 'T12:00:00')
         }));
    
  }

       // Preparar contenedor oculto para renderizado masivo
       // Usamos un div temporal
       const container = document.createElement('div');
       container.style.position = 'absolute';
       container.style.left = '-10000px';
       container.style.width = '700px';
       document.body.appendChild(container);

       const elements: HTMLElement[] = [];
       const names: string[] = [];

       // Renderizar cada uno y capturar el elemento
       // Usamos createRoot si estamos en React 18, pero aquí es más fácil si inyectamos un componente temporal o similar.
       // Alternativa: usar un portal o un estado con todos los invoices y hiddenRefs.
       // Para simplicidad en este componente, usaremos el mismo templateRef pero iterando (o un contenedor dedicado).
       
       alert(`Iniciando generación de ${allInvoices.length} documentos. Por favor espera...`);
       
       // Seteamos un estado temporal para renderizar TODOS los del lote en el DOM oculto
       setBatchForZip(allInvoices);
       
       // Delay para render
       setTimeout(async () => {
         const batchElements = batchRefs.current;
         const finalElements = allInvoices.map((_: any, i: number) => batchElements[i]).filter(Boolean) as HTMLElement[];
         const finalNames = allInvoices.map((inv: any) => `${inv.consecutivo}_${inv.conjuntoNombre}.pdf`.replace(/[^a-zA-Z0-9_.-]/g, '_'));
         
         const zipName = `Cuentas_Recaudo_${dbConjunto}_${filterGenMes}_${filterGenAnio}.zip`;
         await downloadPdfsAsZip(finalElements, finalNames, zipName, 'letter', 'portrait');
         
         setBatchForZip([]);
         setIsDownloading(null);
         document.body.removeChild(container);
       }, 2000);

     } catch (err) {
       console.error("Error generating ZIP:", err);
       alert("Error al generar el ZIP");
       setIsDownloading(null);
     }
   };
 
    const handleExportExcel = async () => {
      setIsDownloading("EXCEL");
      try {
        const res = await getInvoices(1, 2000, dbConjunto, filterGenMes, filterGenAnio, debouncedSearch, debouncedValor);
        if (!res.success) throw new Error(res.error);
        
        const allInvoices = res.invoices;
        if (allInvoices.length === 0) {
          alert("No hay registros para exportar.");
          setIsDownloading(null);
          return;
        }
  
        // Preparar datos para Excel
        const excelRows = allInvoices.map((inv: any) => ({
          "Consecutivo": inv.consecutivo,
          "Conjunto": inv.conjuntoNombre,
          "Mes Gestión": ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][inv.gestionMes - 1],
          "Año Gestión": inv.gestionAnio,
          "Mes Generación": ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][inv.generacionMes - 1],
          "Año Generación": inv.generacionAnio,
          "Fecha Emisión": inv.fechaElaboracion ? new Date(inv.fechaElaboracion).toLocaleDateString('es-CO') : 'N/A',
          "Honorarios": inv.honorariosTotal,
          "IVA": inv.ivaTotal,
          "Total": inv.granTotal,
          "Estado": inv.status,
          "Monto Recaudado": inv.montoRecaudado || 0,
          "Fecha Pago": inv.fechaPago ? new Date(inv.fechaPago).toLocaleDateString('es-CO') : 'N/A',
          "Observación": inv.observacion || ""
        }));
  
        const worksheet = XLSX.utils.json_to_sheet(excelRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Recaudos");
        XLSX.writeFile(workbook, `Gestion_Recaudos_${dbConjunto}_${new Date().toISOString().split('T')[0]}.xlsx`);
  
      } catch (err) {
        console.error("Error exporting Excel:", err);
        alert("Error al exportar Excel");
      } finally {
        setIsDownloading(null);
      }
    };
 
    const [batchForZip, setBatchForZip] = useState<any[]>([]);
   const batchRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

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

  const openPaymentsModal = (invoice: any) => {
    setSelectedInvoiceForPayments(invoice);
    setNewPaymentMonto("");
    setNewPaymentTipo("RECAUDO");
    setNewPaymentFecha(new Date().toISOString().split('T')[0]);
    setNewPaymentMetodo("Transferencia");
    setNewPaymentObs("");
    setIsPaymentsModalOpen(true);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayments) return;
    
    const monto = parseFloat(newPaymentMonto);
    if (isNaN(monto)) {
      alert("Por favor ingresa un monto válido");
      return;
    }

    setIsSavingPayment(true);
    const res = await addPayment(
      selectedInvoiceForPayments.id,
      monto,
      newPaymentTipo,
      newPaymentFecha,
      newPaymentTipo === 'RECAUDO' ? newPaymentMetodo : undefined,
      newPaymentObs
    );

    if (res.success) {
      // Refresh local invoice state
      const updatedInvoiceRes = await getInvoices(page, 20, dbConjunto, filterGenMes, filterGenAnio, debouncedSearch, debouncedValor);
      if (updatedInvoiceRes.success) {
        setInvoices(updatedInvoiceRes.invoices || []);
        
        // Find the updated invoice in the new list to update modal view
        const updatedInvoice = updatedInvoiceRes.invoices.find((i: any) => i.id === selectedInvoiceForPayments.id);
        if (updatedInvoice) {
          setSelectedInvoiceForPayments(updatedInvoice);
        }
      }
      // Reset form
      setNewPaymentMonto("");
      setNewPaymentObs("");
    } else {
      alert(res.error || "Error al agregar abono");
    }
    setIsSavingPayment(false);
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este abono/ajuste?")) return;

    setIsSavingPayment(true);
    const res = await deletePayment(paymentId);
    if (res.success) {
      // Refresh local invoice state
      const updatedInvoiceRes = await getInvoices(page, 20, dbConjunto, filterGenMes, filterGenAnio, debouncedSearch, debouncedValor);
      if (updatedInvoiceRes.success) {
        setInvoices(updatedInvoiceRes.invoices || []);
        
        // Find the updated invoice in the new list to update modal view
        const updatedInvoice = updatedInvoiceRes.invoices.find((i: any) => i.id === selectedInvoiceForPayments.id);
        if (updatedInvoice) {
          setSelectedInvoiceForPayments(updatedInvoice);
        } else {
          setIsPaymentsModalOpen(false);
        }
      }
    } else {
      alert(res.error || "Error al eliminar abono");
    }
    setIsSavingPayment(false);
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente esta cuenta de cobro de la base de datos?\nEsta acción no se puede deshacer.')) return;
    setSavingId(id);
    const res = await deleteInvoice(id);
    if (res.success) {
      setInvoices(prev => prev.filter(i => i.id !== id));
      setTotalCount(prev => prev - 1);
    } else {
      alert(res.error || "Error al eliminar la cuenta de cobro");
    }
    setSavingId(null);
  };

  const handleDeleteBatchFiltered = async () => {
    const filterDesc = [];
    if (dbPortafolio !== "Todos") filterDesc.push(`Portafolio: ${dbPortafolio}`);
    if (dbConjunto !== "Todos") filterDesc.push(`Conjunto/Cartera: ${dbConjunto}`);
    if (filterGenMes !== 0) {
      const monthsMap = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      filterDesc.push(`Mes Generación: ${monthsMap[filterGenMes - 1]}`);
    }
    if (filterGenAnio !== 0) filterDesc.push(`Año Generación: ${filterGenAnio}`);
    if (searchTerm) filterDesc.push(`Búsqueda: "${searchTerm}"`);
    if (searchValor) filterDesc.push(`Valor: "${searchValor}"`);

    const filtersActive = filterDesc.length > 0;
    const confirmMessage = filtersActive
      ? `¿Estás seguro de que deseas eliminar permanentemente TODAS las cuentas de cobro que coinciden con los filtros actuales?\n\nFiltros activos:\n${filterDesc.map(f => `- ${f}`).join("\n")}\n\nEsta acción NO se puede deshacer.`
      : `ATENCIÓN: No tienes ningún filtro seleccionado. Esto eliminará TODAS las cuentas de cobro de la base de datos de todos los meses y portafolios.\n\n¿Estás seguro de que deseas vaciar la base de datos completa?`;

    if (!confirm(confirmMessage)) return;

    if (!filtersActive) {
      const secondConfirm = confirm("ADVERTENCIA FINAL: Estás a punto de borrar la base de datos completa de EMDECOB. ¿Deseas continuar?");
      if (!secondConfirm) return;
    }

    setSavingId("BATCH_DELETE");
    try {
      const res = await deleteInvoicesByFilter(
        dbConjunto,
        filterGenMes,
        filterGenAnio,
        searchTerm,
        searchValor,
        dbPortafolio
      );

      if (res && res.success) {
        alert(`Se han eliminado ${res.count} cuentas de cobro exitosamente.`);
        setPage(1);
        loadData();
      } else {
        alert(res?.error || "Error al realizar la eliminación masiva.");
      }
    } catch (e: any) {
      alert("Error técnico: " + (e.message || "Fallo inesperado"));
    } finally {
      setSavingId(null);
    }
  };

  const handleAnular = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas anular esta cuenta de cobro?')) return;
    
    const reflectInDashboard = confirm('¿Deseas que esta anulación se refleje en los totales del dashboard?\n\n- ACEPTAR: Se contará como anulación.\n- CANCELAR: Se ignorará completamente de las estadísticas.');
    
    setSavingId(id);
    const invoice = invoices.find(i => i.id === id);
    const currentObs = (invoice?.observacion || "").replace("[OMITIR_STATS]", "").trim();
    const newObs = reflectInDashboard ? currentObs : `${currentObs} [OMITIR_STATS]`.trim();

    const res = await updateInvoiceStatus(id, 'ANULADA', null, false, 0, newObs);
    if (res.success) {
      setInvoices(prev => prev.map(i => i.id === id ? { 
        ...i, 
        status: 'ANULADA', 
        fechaPago: null, 
        validadoTesoreria: false, 
        montoPagado: 0,
        observacion: newObs
      } : i));
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
      {/* Template oculto para impresión (off-screen para que html2pdf pueda medirlo) */}
      <div style={{ position: 'absolute', left: '-10000px', top: 0, width: '700px', overflow: 'visible', pointerEvents: 'none' }} aria-hidden="true">
        <div ref={templateRef}>
           {currentInvoiceForPdf && <InvoiceTemplate data={currentInvoiceForPdf} />}
        </div>
        {/* Contenedor para lote masivo */}
        <div id="batch-container">
           {batchForZip.map((inv, idx) => (
             <div key={inv.id} ref={el => { batchRefs.current[idx] = el; }}>
               <InvoiceTemplate data={inv} />
             </div>
           ))}
        </div>
      </div>
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Gestión de Recaudos</h1>
            <p className="text-slate-500 mt-2 flex items-center">
              <ListChecks className="w-4 h-4 mr-2" />
              Administra el estado de pago y validación de las cuentas generadas
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="N° Cuenta..."
                className="pl-9 pr-8 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white w-40 h-[38px] transition-all focus:border-emerald-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 font-bold text-xs">
                $
              </span>
              <input
                type="text"
                value={searchValor}
                onChange={(e) => setSearchValor(e.target.value)}
                placeholder="Filtrar por Valor..."
                className="pl-7 pr-8 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white w-44 h-[38px] transition-all focus:border-emerald-500"
              />
              {searchValor && (
                <button
                  onClick={() => setSearchValor("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
               <select 
                 value={filterGenMes}
                 onChange={(e) => { setFilterGenMes(parseInt(e.target.value)); setPage(1); }}
                 className="text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
               >
                 <option value={0}>Mes Gen: Todos</option>
                 {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, idx) => (
                   <option key={idx + 1} value={idx + 1}>{m}</option>
                 ))}
               </select>
               <select 
                 value={filterGenAnio}
                 onChange={(e) => { setFilterGenAnio(parseInt(e.target.value)); setPage(1); }}
                 className="text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
               >
                 <option value={0}>Año Gen: Todos</option>
                 {[2024, 2025, 2026, 2027].map(y => (
                   <option key={y} value={y}>{y}</option>
                 ))}
               </select>
            </div>
 
             {isAdmin && (
               <select 
                 value={dbPortafolio}
                 onChange={(e) => { setDbPortafolio(e.target.value); setDbConjunto("Todos"); setPage(1); }}
                 className="text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
               >
                 <option value="Todos">Portafolio: Todos</option>
                 <option value="PROPIEDAD HORIZONTAL">Propiedad Horizontal</option>
                 <option value="MIXTO">Mixto</option>
               </select>
             )}

             <SearchableSelect 
               label="Filtrar por Conjunto"
               options={conjuntos}
               value={dbConjunto}
               onChange={(val) => { setDbConjunto(val); setPage(1); }}
             />
            
            <div className="flex gap-2">
               <div className="flex flex-col">
                 <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fecha Emisión PDF</label>
                 <input 
                   type="date"
                   value={overrideFechaPdf}
                   onChange={(e) => setOverrideFechaPdf(e.target.value)}
                   className="text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white h-[38px]"
                   title="Si se establece, esta fecha aparecerá en el PDF descargado"
                 />
               </div>

               <div className="flex items-end gap-2">
                 {(dbConjunto !== "Todos" || (isAdmin && dbPortafolio !== "Todos") || filterGenMes !== 0 || filterGenAnio !== 0 || overrideFechaPdf !== "" || searchTerm !== "" || searchValor !== "") && (
                   <button 
                     onClick={() => { setDbConjunto("Todos"); if (isAdmin) setDbPortafolio("Todos"); setFilterGenMes(0); setFilterGenAnio(0); setOverrideFechaPdf(""); setSearchTerm(""); setSearchValor(""); setPage(1); }}
                     className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors h-[38px]"
                     title="Limpiar Filtros"
                   >
                     <X className="w-4 h-4" />
                   </button>
                 )}
                 
                  <button 
                    onClick={handleExportExcel}
                    disabled={isDownloading === "EXCEL" || invoices.length === 0}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 h-[38px]"
                  >
                    {isDownloading === "EXCEL" ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                    )}
                    Exportar Excel
                  </button>

                  <button 
                    onClick={handleDownloadBulkZip}
                    disabled={isDownloading === "BULK" || invoices.length === 0}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center hover:bg-slate-800 transition-all shadow-md shadow-slate-900/20 disabled:opacity-50 h-[38px]"
                  >
                    {isDownloading === "BULK" ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <FileArchive className="w-4 h-4 mr-2" />
                    )}
                    Descargar Lote (ZIP)
                  </button>

                  {isAdmin && (
                    <button 
                      onClick={handleDeleteBatchFiltered}
                      disabled={savingId === "BATCH_DELETE" || invoices.length === 0}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold flex items-center hover:bg-red-750 transition-all shadow-md shadow-red-600/20 disabled:opacity-50 h-[38px]"
                      title="Eliminar permanentemente todas las cuentas que coincidan con los filtros seleccionados"
                    >
                      {savingId === "BATCH_DELETE" ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Eliminación Masiva
                    </button>
                  )}
               </div>
            </div>
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
                  <th className="px-5 py-4 font-semibold whitespace-nowrap min-w-[100px]">Conse.</th>
                  <th className="px-5 py-4 font-semibold min-w-[200px]">Conjunto</th>
                  <th className="px-5 py-4 font-semibold text-center whitespace-nowrap min-w-[120px]">Mes Gestión</th>
                  <th className="px-5 py-4 font-semibold text-center whitespace-nowrap min-w-[120px]">Mes Generación</th>
                  <th className="px-5 py-4 font-semibold text-center whitespace-nowrap min-w-[120px]">Fecha Emisión</th>
                  <th className="px-5 py-4 font-semibold text-right whitespace-nowrap min-w-[110px]">Honorarios</th>
                  <th className="px-5 py-4 font-semibold text-right whitespace-nowrap min-w-[100px]">IVA</th>
                  <th className="px-5 py-4 font-semibold text-right whitespace-nowrap min-w-[110px]">Total</th>
                  <th className="px-5 py-4 font-semibold text-center whitespace-nowrap min-w-[130px]">Estado Pago</th>
                  <th className="px-5 py-4 font-semibold text-center whitespace-nowrap min-w-[125px]">Monto Recaudado</th>
                  <th className="px-5 py-4 font-semibold text-center whitespace-nowrap min-w-[100px]">Validación</th>
                  <th className="px-5 py-4 font-semibold text-center whitespace-nowrap min-w-[150px]">Fecha Pago</th>
                  <th className="px-5 py-4 font-semibold text-center whitespace-nowrap min-w-[250px]">Observación</th>
                  <th className="px-5 py-4 font-semibold text-right sticky right-0 bg-slate-50 shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.1)] whitespace-nowrap min-w-[120px]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 min-h-[300px]">
                {invoices.map((inv) => {
                  // Calcular defaults basados en fecha de elaboración o creación
                  const fallbackDate = inv.fechaElaboracion ? new Date(inv.fechaElaboracion) : (inv.createdAt ? new Date(inv.createdAt) : new Date());
                  const defaultMes = fallbackDate.getMonth() + 1;
                  const defaultAnio = fallbackDate.getFullYear();
                  const gMes = inv.gestionMes || defaultMes;
                  const gAnio = inv.gestionAnio || defaultAnio;
                  const genMes = inv.generacionMes || defaultMes;
                  const genAnio = inv.generacionAnio || defaultAnio;

                  return (
                  <tr key={inv.id} className={`group hover:bg-slate-50 transition-colors ${savingId === inv.id ? 'opacity-50' : ''} ${inv.status === 'ANULADA' ? 'bg-slate-50 opacity-60' : ''}`}>
                    <td className="px-5 py-4 font-medium text-slate-700 whitespace-nowrap">
                       {isAdmin ? (
                         <input 
                           type="text"
                           value={inv.consecutivo}
                           onChange={(e) => {
                             const newVal = e.target.value;
                             setInvoices(invoices.map(i => i.id === inv.id ? { ...i, consecutivo: newVal } : i));
                           }}
                           onBlur={(e) => handleMetadataChange(inv.id, gMes, gAnio, genMes, genAnio, inv.fechaElaboracion, e.target.value)}
                           disabled={savingId === inv.id}
                           className="text-xs font-bold border border-slate-200 rounded px-2 py-1 w-24 outline-none focus:border-blue-500"
                         />
                       ) : (
                         inv.consecutivo
                       )}
                     </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-800">{inv.conjuntoNombre}</div>
                      <div className="text-[10px] text-slate-500">{inv.items?.length || 0} items</div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {isAdmin ? (
                        <div className="flex flex-col items-center gap-1">
                          <select 
                            value={gMes}
                            onChange={(e) => handleMetadataChange(inv.id, parseInt(e.target.value), gAnio, genMes, genAnio, inv.fechaElaboracion)}
                            disabled={savingId === inv.id}
                            className="text-xs border border-slate-200 rounded px-2 py-1 outline-none focus:border-emerald-500"
                          >
                            {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, idx) => (
                              <option key={idx + 1} value={idx + 1}>{m}</option>
                            ))}
                          </select>
                          <select 
                            value={gAnio}
                            onChange={(e) => handleMetadataChange(inv.id, gMes, parseInt(e.target.value), genMes, genAnio, inv.fechaElaboracion)}
                            disabled={savingId === inv.id}
                            className="text-xs border border-slate-200 rounded px-2 py-1 outline-none focus:border-emerald-500"
                          >
                            {[2023, 2024, 2025, 2026, 2027, 2028].map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="text-xs font-medium text-slate-600">
                          {`${["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][gMes - 1]} ${gAnio}`}
                        </div>
                      )}
                    </td>

                    {/* MES GENERACIÓN */}
                    <td className="px-5 py-4 text-center">
                      {isAdmin ? (
                        <div className="flex flex-col items-center gap-1">
                          <select 
                            value={genMes}
                            onChange={(e) => handleMetadataChange(inv.id, gMes, gAnio, parseInt(e.target.value), genAnio, inv.fechaElaboracion)}
                            disabled={savingId === inv.id}
                            className="text-xs border border-slate-200 rounded px-2 py-1 outline-none focus:border-emerald-500"
                          >
                            {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, idx) => (
                              <option key={idx + 1} value={idx + 1}>{m}</option>
                            ))}
                          </select>
                          <select 
                            value={genAnio}
                            onChange={(e) => handleMetadataChange(inv.id, gMes, gAnio, genMes, parseInt(e.target.value), inv.fechaElaboracion)}
                            disabled={savingId === inv.id}
                            className="text-xs border border-slate-200 rounded px-2 py-1 outline-none focus:border-emerald-500"
                          >
                            {[2023, 2024, 2025, 2026, 2027, 2028].map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="text-xs font-medium text-slate-600">
                          {`${["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][genMes - 1]} ${genAnio}`}
                        </div>
                      )}
                    </td>

                    {/* FECHA EMISIÓN */}
                    <td className="px-5 py-4 text-center">
                      {isAdmin ? (
                        <input
                          type="date"
                          className="text-xs border border-slate-200 rounded px-2 py-1 outline-none focus:border-emerald-500"
                          value={inv.fechaElaboracion ? new Date(inv.fechaElaboracion).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleMetadataChange(inv.id, gMes, gAnio, genMes, genAnio, e.target.value)}
                          disabled={savingId === inv.id}
                        />
                      ) : (
                        <div className="text-xs font-medium text-slate-600">
                          {inv.fechaElaboracion ? new Date(inv.fechaElaboracion).toLocaleDateString('es-CO') : 'N/A'}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-slate-600 whitespace-nowrap">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(inv.honorariosTotal)}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-slate-500 whitespace-nowrap text-[11px]">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(inv.ivaTotal)}
                    </td>
                    <td className="px-5 py-4 font-bold text-emerald-700 whitespace-nowrap text-right">
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
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => openPaymentsModal(inv)}
                            className="text-xs font-bold text-slate-800 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1 group bg-slate-50 border border-slate-200 rounded px-2.5 py-1 hover:border-emerald-500 shadow-sm"
                            title="Ver/Registrar Abonos"
                          >
                            <span>
                              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(inv.montoPagado || 0)}
                            </span>
                          </button>
                          
                          {/* Saldo Pendiente o Anticipo */}
                          {(() => {
                            const totalAjustes = inv.payments?.filter((p: any) => p.tipo === 'DESCUENTO' || p.tipo === 'AJUSTE').reduce((sum: number, p: any) => sum + p.monto, 0) || 0;
                            const totalCreditos = (inv.montoPagado || 0) + totalAjustes;
                            const balance = inv.granTotal - totalCreditos;
                            
                            if (balance > 0.5) {
                              return (
                                <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">
                                  Falta: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(balance)}
                                </span>
                              );
                            } else if (balance < -0.5) {
                              return (
                                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                                  Anticipo: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Math.abs(balance))}
                                </span>
                              );
                            } else {
                              return (
                                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  Saldada
                                </span>
                              );
                            }
                          })()}
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
                     <td className="px-5 py-4 text-right sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.1)] transition-colors whitespace-nowrap min-w-[120px]">
                       <div className="flex justify-end gap-1">
                         <button 
                           onClick={() => handleDownloadPdf(inv)}
                           disabled={isDownloading === inv.id}
                           className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                           title="Descargar PDF"
                         >
                           {isDownloading === inv.id ? (
                             <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                           ) : (
                             <Download className="w-4 h-4" />
                           )}
                         </button>
                         {inv.status !== 'ANULADA' && (
                           <button 
                             onClick={() => handleAnular(inv.id)}
                             className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                             title="Anular Cuenta"
                           >
                             <AlertCircle className="w-4 h-4" />
                           </button>
                         )}
                         {isAdmin && (
                           <button 
                             onClick={() => handleDeleteInvoice(inv.id)}
                             disabled={savingId === inv.id}
                             className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                             title="Eliminar permanentemente de la Base de Datos"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         )}
                       </div>
                     </td>
                  </tr>
                  );
                })}
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

      {/* Modal de Historial de Abonos y Ajustes */}
      {isPaymentsModalOpen && selectedInvoiceForPayments && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Historial de Abonos y Ajustes</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Cuenta: <span className="text-emerald-400 font-bold">{selectedInvoiceForPayments.consecutivo}</span> | {selectedInvoiceForPayments.conjuntoNombre}
                </p>
              </div>
              <button 
                onClick={() => setIsPaymentsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Resumen Contable */}
              {(() => {
                const totalFacturado = selectedInvoiceForPayments.granTotal || 0;
                const totalRecaudado = selectedInvoiceForPayments.montoPagado || 0;
                const totalAjustes = selectedInvoiceForPayments.payments
                  ?.filter((p: any) => p.tipo === 'DESCUENTO' || p.tipo === 'AJUSTE')
                  .reduce((sum: number, p: any) => sum + p.monto, 0) || 0;
                const totalCreditos = totalRecaudado + totalAjustes;
                const balance = totalFacturado - totalCreditos;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Total Facturado</span>
                      <span className="text-base font-bold text-slate-800">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalFacturado)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Total Recaudado</span>
                      <span className="text-base font-bold text-emerald-700">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalRecaudado)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Ajustes / Descuentos</span>
                      <span className="text-base font-bold text-blue-700">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalAjustes)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {balance >= -0.5 ? 'Saldo Pendiente' : 'Saldo a Favor'}
                      </span>
                      <span className={`text-base font-black ${balance > 0.5 ? 'text-rose-600' : balance < -0.5 ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Math.abs(balance))}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Tabla de Historial */}
              <div>
                <h4 className="font-bold text-sm text-slate-700 mb-3">Movimientos Registrados</h4>
                {(!selectedInvoiceForPayments.payments || selectedInvoiceForPayments.payments.length === 0) ? (
                  <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-lg text-center border border-slate-100">
                    No se han registrado abonos o ajustes para esta cuenta de cobro.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2">Fecha</th>
                          <th className="px-4 py-2">Monto</th>
                          <th className="px-4 py-2">Tipo</th>
                          <th className="px-4 py-2">Método</th>
                          <th className="px-4 py-2">Observación</th>
                          <th className="px-4 py-2 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {selectedInvoiceForPayments.payments.map((pay: any) => (
                          <tr key={pay.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-medium text-slate-600">
                              {new Date(pay.fecha).toLocaleDateString('es-CO', { timeZone: 'UTC' })}
                            </td>
                            <td className="px-4 py-2.5 font-bold text-slate-800">
                              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(pay.monto)}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                                pay.tipo === 'RECAUDO' ? 'bg-emerald-100 text-emerald-800' :
                                pay.tipo === 'CRUCE_ANTICIPO' ? 'bg-amber-100 text-amber-800' :
                                pay.tipo === 'DESCUENTO' ? 'bg-blue-100 text-blue-800' :
                                'bg-slate-100 text-slate-800'
                              }`}>
                                {pay.tipo}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-500">{pay.metodo || 'N/A'}</td>
                            <td className="px-4 py-2.5 text-slate-500 max-w-[150px] truncate" title={pay.observacion}>
                              {pay.observacion || '-'}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <button 
                                onClick={() => handleDeletePayment(pay.id)}
                                disabled={isSavingPayment}
                                className="text-rose-500 hover:text-rose-700 disabled:opacity-30 p-1 hover:bg-rose-50 rounded"
                                title="Eliminar abono"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Formulario para agregar */}
              <div className="border-t border-slate-100 pt-6">
                <h4 className="font-bold text-sm text-slate-700 mb-3">Registrar Nuevo Movimiento</h4>
                <form onSubmit={handleAddPayment} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tipo de Movimiento</label>
                    <select
                      value={newPaymentTipo}
                      onChange={(e) => {
                        setNewPaymentTipo(e.target.value);
                        if (e.target.value !== 'RECAUDO') {
                          setNewPaymentMetodo("");
                        } else {
                          setNewPaymentMetodo("Transferencia");
                        }
                      }}
                      className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    >
                      <option value="RECAUDO">PAGO REGULAR (CAJA/BANCO)</option>
                      <option value="CRUCE_ANTICIPO">CRUCE DE ANTICIPO / SALDO A FAVOR</option>
                      <option value="DESCUENTO">DESCUENTO (PRONTO PAGO, ETC.)</option>
                      <option value="AJUSTE">AJUSTE MANUAL (NOTA CRÉDITO/MENOR CUANTÍA)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fecha de Registro</label>
                    <input
                      type="date"
                      value={newPaymentFecha}
                      onChange={(e) => setNewPaymentFecha(e.target.value)}
                      required
                      className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Monto ($ COP)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Monto (ej: 50000 o -20000)"
                      value={newPaymentMonto}
                      onChange={(e) => setNewPaymentMonto(e.target.value)}
                      required
                      className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Método de Pago</label>
                    <select
                      value={newPaymentMetodo}
                      onChange={(e) => setNewPaymentMetodo(e.target.value)}
                      disabled={newPaymentTipo !== 'RECAUDO'}
                      className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      {newPaymentTipo === 'RECAUDO' ? (
                        <>
                          <option value="Transferencia">Transferencia</option>
                          <option value="Consignación">Consignación</option>
                          <option value="Efectivo">Efectivo</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Otro">Otro</option>
                        </>
                      ) : (
                        <option value="">No aplica</option>
                      )}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Observaciones</label>
                    <input
                      type="text"
                      placeholder="Detalle o justificación del movimiento..."
                      value={newPaymentObs}
                      onChange={(e) => setNewPaymentObs(e.target.value)}
                      className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-2">
                    <button
                      type="submit"
                      disabled={isSavingPayment}
                      className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center"
                    >
                      {isSavingPayment ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        "Registrar Movimiento"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
