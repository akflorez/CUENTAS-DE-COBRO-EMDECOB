"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { useAppContext, FileData } from "@/context/AppContext";
import { groupRecords } from "@/lib/mapper";
import { saveInvoiceRecord } from "@/app/actions/invoice";
import { UploadCloud, FileSpreadsheet, ArrowRight, AlertCircle, X, PlusCircle, Settings, Play, CalendarDays, Database, CheckCircle2 } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const { filesData, setFilesData, startingConsecutive, setStartingConsecutive, excelData } = useAppContext();
  
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 });
  const [fileDate, setFileDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [gestionMonth, setGestionMonth] = useState<number>(new Date().getMonth()); // 0-indexed for JS but we'll show 1-12
  const [gestionYear, setGestionYear] = useState<number>(new Date().getFullYear());

  const processFile = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
      setError("Formato no válido. Por favor suba archivos Excel (.xlsx o .xls).");
      return;
    }

    // Evitar duplicados por nombre
    if (filesData.some(f => f.fileName === file.name)) {
      setError(`El archivo "${file.name}" ya fue cargado.`);
      return;
    }

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        if (jsonData.length === 0) {
          setError(`El archivo "${file.name}" está vacío.`);
          setIsLoading(false);
          return;
        }

        const columns = Object.keys(jsonData[0] as object);
        
        setFilesData(prev => [...prev, {
          fileName: file.name,
          data: jsonData as any[],
          headers: columns,
          referenceDate: fileDate ? new Date(fileDate) : undefined,
          gestionMonth: (gestionMonth + 1), // Store as 1-indexed
          gestionYear: gestionYear
        }]);
        
        setIsLoading(false);

      } catch (err) {
        console.error("Error procesando Excel", err);
        setError(`Hubo un error al leer "${file.name}". Asegúrese de que no esté corrupto.`);
        setIsLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const processMultipleFiles = (files: FileList | File[]) => {
    Array.from(files).forEach(file => processFile(file));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processMultipleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processMultipleFiles(e.target.files);
    }
    // resetear input para permitir subir el mismo archivo de nuevo si fue eliminado
    e.target.value = ''; 
  };

  const removeFile = (fileName: string) => {
    setFilesData(prev => prev.filter(f => f.fileName !== fileName));
  };

  const handleSaveToDashboard = async () => {
    if (filesData.length === 0) return;
    if (!confirm(`¿Estás seguro de que deseas guardar estos ${filesData.length} archivos directamente en el Dashboard?`)) return;

    setIsSaving(true);
    setError(null);
    
    try {
      const mappedInvoices = groupRecords(excelData, startingConsecutive);
      
      setSaveProgress({ current: 0, total: mappedInvoices.length });
      
      let count = 0;
      for (const inv of mappedInvoices) {
        const res = await saveInvoiceRecord(inv);
        if (!res.success) {
          console.error(`Error guardando ${inv.consecutivo}:`, res.error);
        }
        count++;
        setSaveProgress({ current: count, total: mappedInvoices.length });
      }

      alert(`Se han guardado ${count} cuentas de cobro exitosamente.`);
      router.push("/dashboard/gestion");
    } catch (err: any) {
      setError("Error al guardar en el dashboard: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const totalRecords = filesData.reduce((acc, file) => acc + file.data.length, 0);

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Cargar Archivos de Datos</h1>
        <p className="text-slate-500 mt-2">
          Sube uno o varios archivos de Excel de diferentes conjuntos para generar cuentas de cobro masivamente.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 mb-8
            ${isDragging 
              ? "border-green-500 bg-green-50/50" 
              : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
            }
          `}
        >
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            multiple
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-full transition-colors ${isDragging ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-600"}`}>
              <UploadCloud className="w-10 h-10" />
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            Arrastra tus archivos Excel aquí
          </h3>
          <p className="text-slate-500 mb-4 max-w-sm mx-auto text-sm">
            Puedes subir varios archivos a la vez
          </p>
          
          <span className="inline-flex items-center justify-center px-6 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors pointer-events-none">
            <PlusCircle className="w-4 h-4 mr-2" /> Seleccionar archivos
          </span>
        </div>

        {filesData.length === 0 && (
          <div className="flex flex-col gap-6 p-8 bg-indigo-50/50 rounded-2xl border border-indigo-100 mb-8 animate-in fade-in zoom-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Fecha de Emisión */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-indigo-700">
                  <CalendarDays className="w-5 h-5" />
                  <p className="font-bold text-sm uppercase tracking-wide">Fecha de Emisión de las Cuentas</p>
                </div>
                <input 
                  type="date" 
                  value={fileDate}
                  onChange={(e) => setFileDate(e.target.value)}
                  className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-lg font-bold text-indigo-900 focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-sm transition-all"
                />
                <p className="text-xs text-indigo-500 font-medium">Esta es la fecha que aparecerá como "Fecha de Elaboración" en las cuentas de cobro.</p>
              </div>

              {/* Gestión Selector */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-indigo-700">
                  <Settings className="w-5 h-5" />
                  <p className="font-bold text-sm uppercase tracking-wide">¿De qué mes es este reporte?</p>
                </div>
                <div className="flex gap-2">
                  <select 
                    value={gestionMonth}
                    onChange={(e) => setGestionMonth(parseInt(e.target.value))}
                    className="flex-grow bg-white border border-indigo-200 rounded-xl px-4 py-3 text-lg font-bold text-indigo-900 focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-sm transition-all appearance-none"
                  >
                    {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                  <select 
                    value={gestionYear}
                    onChange={(e) => setGestionYear(parseInt(e.target.value))}
                    className="w-32 bg-white border border-indigo-200 rounded-xl px-4 py-3 text-lg font-bold text-indigo-900 focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-sm transition-all appearance-none"
                  >
                    {[2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-indigo-500 font-medium">Esto define si es "Gestión Marzo", "Gestión Abril", etc.</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 border-l-4 border-red-500 bg-red-50 p-4 rounded-r-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {filesData.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-700 flex items-center justify-between">
              <span>Archivos Cargados ({filesData.length})</span>
              <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">{totalRecords} registros totales</span>
            </h4>
            
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
              {filesData.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg group hover:border-green-300 transition-colors">
                  <div className="flex items-center overflow-hidden">
                    <FileSpreadsheet className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <div className="truncate">
                      <p className="text-sm font-medium text-slate-700 truncate">{file.fileName}</p>
                      <p className="text-xs text-slate-500">
                        {file.data.length} registros • <strong>Gestión {file.gestionMonth}/{file.gestionYear}</strong>
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFile(file.fileName)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Eliminar archivo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
               <div>
                  <h4 className="font-semibold text-slate-700 flex items-center mb-1">
                     <Settings className="w-4 h-4 mr-2 text-slate-500" />
                     Configuración de Generación
                  </h4>
                  <p className="text-sm text-slate-500">
                     Ingresa desde qué número inicial deseas generar los consecutivos de este bloque.
                  </p>
               </div>
               <div className="flex items-center bg-white border border-slate-300 rounded-lg px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 transition-all">
                  <span className="text-slate-400 font-medium mr-2">No.</span>
                  <input 
                    type="number" 
                    min="1"
                    value={startingConsecutive}
                    onChange={(e) => setStartingConsecutive(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-lg font-bold text-slate-700 border-none p-0 outline-none focus:ring-0 text-center" 
                  />
               </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex flex-col md:flex-row gap-4 pt-4 mt-8">
              <button 
                onClick={handleSaveToDashboard}
                disabled={isSaving || filesData.length === 0}
                className="flex-1 bg-white border-2 border-slate-900 text-slate-900 px-6 py-4 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center disabled:opacity-50 shadow-sm"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-3"></div>
                    Guardando {saveProgress.current}/{saveProgress.total}...
                  </>
                ) : (
                  <>
                    <Database className="w-5 h-5 mr-2" />
                    Guardar Directo en Gestión
                  </>
                )}
              </button>

              <button 
                onClick={() => router.push("/dashboard/preview")}
                disabled={isSaving || filesData.length === 0}
                className="flex-[1.5] bg-slate-900 text-white px-6 py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center shadow-lg shadow-slate-900/20 disabled:opacity-50"
              >
                Continuar a Vista Previa
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
