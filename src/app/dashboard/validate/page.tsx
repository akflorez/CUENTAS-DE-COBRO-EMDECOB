"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { validateRecord, ValidationResult, groupRecords, MappedRecord } from "@/lib/mapper";
import { CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Eye, FileSpreadsheet, Search, Trash2, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { saveInvoiceRecord } from "@/app/actions/invoice";

export default function ValidatePage() {
  const router = useRouter();
  const { excelData, filesData, startingConsecutive } = useAppContext();
  const [filter, setFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{success: boolean, message: string} | null>(null);
  
  // Estado local para permitir eliminar registros de la vista previa de validación
  const [localRecords, setLocalRecords] = useState<{isValid: boolean; errors: string[]; mapped: MappedRecord}[]>([]);

  // Redirigir si no hay data
  useEffect(() => {
    if (!excelData || excelData.length === 0) {
      router.push("/dashboard/upload");
    }
  }, [excelData, router]);

  // Cargar registros agrupados al inicio
  useEffect(() => {
    if (excelData && excelData.length > 0) {
      const grouped = groupRecords(excelData, startingConsecutive).map((mapped) => {
        return {
          ...validateRecord(mapped),
          mapped
        };
      });
      setLocalRecords(grouped);
    }
  }, [excelData, startingConsecutive]);

  const stats = useMemo(() => {
    const validCount = localRecords.filter(v => v.isValid).length;
    const invalidCount = localRecords.length - validCount;
    return { total: localRecords.length, valid: validCount, invalid: invalidCount };
  }, [localRecords]);

  const filteredDocs = localRecords.filter(v => {
    const matchesSearch = (v.mapped.conjuntoNombre || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'valid' ? v.isValid : !v.isValid);
    return matchesSearch && matchesFilter;
  });

  const handleDelete = (consecutivo: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este registro de la validación actual?")) {
      setLocalRecords(prev => prev.filter(r => r.mapped.consecutivo !== consecutivo));
    }
  };

  const handleSaveBatch = async () => {
    const validOnes = localRecords.filter(r => r.isValid);
    if (validOnes.length === 0) return;

    setIsSaving(true);
    setSaveStatus(null);
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    try {
      for (const record of validOnes) {
        const res = await saveInvoiceRecord(record.mapped);
        if (res.success) {
          successCount++;
        } else if (res.error === 'Invoice already exists') {
          skipCount++;
        } else {
          errorCount++;
        }
      }
      
      let message = `Proceso terminado. `;
      if (successCount > 0) message += `Guardados: ${successCount}. `;
      if (skipCount > 0) message += `${skipCount} ya existían. `;
      if (errorCount > 0) message += `Errores: ${errorCount}.`;
      
      setSaveStatus({ 
        success: errorCount === 0, 
        message 
      });
    } catch (error) {
      setSaveStatus({ success: false, message: "Ocurrió un error al intentar guardar los registros." });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  if (!excelData || excelData.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Validación y Mapeo</h1>
          <p className="text-slate-500 mt-2 flex items-center">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Procesando: <strong>{filesData.length} archivo(s) cargados</strong>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/upload"
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 flex items-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cambiar Archivo
          </Link>
          
          <button 
            disabled={isSaving || stats.valid === 0}
            onClick={handleSaveBatch}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 flex items-center shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isSaving ? "Guardando..." : "Guardar en Dashboard"}
          </button>

          <button 
            disabled={stats.valid === 0}
            onClick={() => router.push("/dashboard/preview")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Vista Previa y Generar
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className={cn(
          "mb-6 p-4 rounded-xl border flex items-center animate-in slide-in-from-top-2",
          saveStatus.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
        )}>
          {saveStatus.success ? <CheckCircle2 className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
          <span className="font-medium">{saveStatus.message}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Registros</p>
          <p className="text-4xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-6 flex flex-col justify-center">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">Válidos (Listos)</p>
              <p className="text-4xl font-bold text-green-700">{stats.valid}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-6 flex flex-col justify-center">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-red-700 mb-1">Con Errores</p>
              <p className="text-4xl font-bold text-red-700">{stats.invalid}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 mb-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setFilter('all')}
            className={cn("pb-4 text-sm font-medium border-b-2 transition-colors", filter === 'all' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700")}
          >
            Todos ({stats.total})
          </button>
          <button
            onClick={() => setFilter('valid')}
            className={cn("pb-4 text-sm font-medium border-b-2 transition-colors", filter === 'valid' ? "border-green-600 text-green-600" : "border-transparent text-slate-500 hover:text-slate-700")}
          >
            Válidos ({stats.valid})
          </button>
          <button
            onClick={() => setFilter('invalid')}
            className={cn("pb-4 text-sm font-medium border-b-2 transition-colors", filter === 'invalid' ? "border-red-600 text-red-600" : "border-transparent text-slate-500 hover:text-slate-700")}
          >
            Con Errores ({stats.invalid})
          </button>
        </div>

        <div className="relative pb-4 md:w-64">
           <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
           <input 
              type="text" 
              placeholder="Buscar conjunto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
           />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 font-semibold">
              <tr>
                <th scope="col" className="px-6 py-4">Estado</th>
                <th scope="col" className="px-6 py-4">Conjunto / Cartera</th>
                <th scope="col" className="px-6 py-4">Asesor</th>
                <th scope="col" className="px-6 py-4">Registros</th>
                <th scope="col" className="px-6 py-4 text-right">Monto Total</th>
                <th scope="col" className="px-6 py-4">Observaciones</th>
                <th scope="col" className="px-6 py-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredDocs.map((item, idx) => (
                <tr key={item.mapped.consecutivo || idx} className={cn("hover:bg-slate-50/50 transition-colors group", !item.isValid && "bg-red-50/30")}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.isValid ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Válido
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        <AlertCircle className="w-3.5 h-3.5 mr-1" /> Error
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {item.mapped.conjuntoNombre || <span className="text-slate-400 italic">No definido</span>}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {item.mapped.asesor || "-"}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {item.mapped.items ? item.mapped.items.length : 0} items
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900 text-right">
                    {item.mapped.granTotal > 0 
                      ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.mapped.granTotal)
                      : <span className="text-red-500 font-normal">Falta valor</span>
                    }
                  </td>
                  <td className="px-6 py-4 text-xs text-red-600 max-w-[200px] truncate">
                    {!item.isValid ? item.errors.join(", ") : <span className="text-slate-400 font-normal">Listo</span>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleDelete(item.mapped.consecutivo)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredDocs.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            {searchTerm ? `No se encontraron resultados para "${searchTerm}"` : "No se encontraron registros en esta categoría."}
          </div>
        )}
      </div>
    </div>
  );
}
