"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { validateRecord, groupRecords, MappedRecord } from "@/lib/mapper";
import { ArrowLeft, Download, FileArchive, CheckCircle2, ChevronLeft, ChevronRight, Edit2, X, Save } from "lucide-react";
import Link from "next/link";
import { InvoiceTemplate } from "@/components/InvoiceTemplate";
import { downloadPdf, downloadPdfsAsZip, generatePdfBlob, PdfFormat, PdfOrientation } from "@/lib/pdfGenerator";
import { createPortal } from "react-dom";

export default function PreviewPage() {
  const router = useRouter();
  const { excelData, filesData, startingConsecutive } = useAppContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState("");
  const currentPreviewRef = useRef<HTMLDivElement>(null);
  const [overrides, setOverrides] = useState<Record<number, Partial<MappedRecord>>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<MappedRecord>>({});
  const [pdfFormat, setPdfFormat] = useState<PdfFormat>('letter');
  const [pdfOrientation, setPdfOrientation] = useState<PdfOrientation>('portrait');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Altura de contenido por hoja Carta (mm → px):
  // Letter = 279mm; márgenes sup+inf = 12mm c/u → content = 255mm → aprox 950px a 96dpi (ajustado para coincidir exacto con html2pdf)
  const LETTER_PAGE_PX = 950;

  // Hidden references for bulk generation
  const hiddenRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hiddenContainerRef = useRef<HTMLDivElement>(null);

  // Redirigir si no hay data
  useEffect(() => {
    if (!excelData || excelData.length === 0) {
      router.push("/dashboard/upload");
    }
  }, [excelData, router]);

  // Generar el PDF real para la vista previa
  useEffect(() => {
    if (!currentPreviewRef.current) return;
    
    const generatePreview = async () => {
      setIsPreviewLoading(true);
      try {
        // Pequeño delay para asegurar que React renderizó el InvoiceTemplate oculto
        await new Promise(r => setTimeout(r, 150));
        
        if (currentPreviewRef.current) {
          const blob = await generatePdfBlob(currentPreviewRef.current, pdfFormat, pdfOrientation);
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        }
      } catch (error) {
        console.error("Error generando vista previa PDF:", error);
      } finally {
        setIsPreviewLoading(false);
      }
    };

    generatePreview();

    return () => {
      // Limpiar URL anterior para evitar memory leaks
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [currentIndex, overrides, pdfFormat, pdfOrientation]);

  const validRecords = useMemo(() => {
    if (!excelData) return [];
    return groupRecords(excelData, startingConsecutive).map((mapped) => ({ 
      ...validateRecord(mapped), 
      mapped 
    })).filter(r => r.isValid);
  }, [excelData, startingConsecutive]);

  if (!excelData || excelData.length === 0 || validRecords.length === 0) {
    return (
       <div className="flex justify-center items-center h-64 flex-col">
         <p>No hay registros válidos para vista previa.</p>
         <button onClick={() => router.push("/dashboard/validate")} className="mt-4 text-blue-600 underline">Volver a validación</button>
       </div>
    );
  }

  const currentRecord = validRecords[currentIndex];
  
  const currentRecordMerged = {
    ...currentRecord.mapped,
    ...(overrides[currentIndex] || {})
  };

  const handleDownloadSingle = async () => {
    if (!currentPreviewRef.current) return;
    setIsGenerating(true);
    setGenerationProgress("Generando PDF...");
    try {
      const name = `${currentRecordMerged.conjuntoNombre || 'Conjunto'}.pdf`.replace(/[^a-zA-Z0-9_.-]/g, '_');
      await downloadPdf(currentPreviewRef.current, name, pdfFormat, pdfOrientation);
      
      // Guardar en Base de Datos
      const { saveInvoiceRecord } = await import("@/app/actions/invoice");
      await saveInvoiceRecord(currentRecordMerged);

    } catch (e) {
      console.error('PDF error:', e);
      alert(`Error al generar el PDF: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsGenerating(false);
      setGenerationProgress("");
    }
  };

  const handleDownloadZip = async () => {
    setIsGenerating(true);
    setGenerationProgress(`Preparando ${validRecords.length} documentos...`);
    try {
      // Con html2pdf.js ya no dependemos estrictamente de mostrar/ocultar 
      // si el contenedor tiene overflow visible off-screen.
      const elements = hiddenRefs.current.slice(0, validRecords.length).filter(Boolean) as HTMLElement[];
      const names = validRecords.map((r, i) => {
        const merged = { ...r.mapped, ...(overrides[i] || {}) };
        return `${merged.consecutivo}_${merged.conjuntoNombre}.pdf`.replace(/[^a-zA-Z0-9_.-]/g, '_');
      });
      
      setGenerationProgress(`Generando y comprimiendo... esto puede tardar unos minutos.`);
      
      const zipFallbackName = filesData.length === 1 ? filesData[0].fileName.replace('.xlsx', '') : `Lote_${filesData.length}_Archivos`;
      await downloadPdfsAsZip(elements, names, `Cuentas_Cobro_${zipFallbackName}.zip`, pdfFormat, pdfOrientation);
      
      // Guardar todo en Base de Datos
      const { saveInvoiceRecord } = await import("@/app/actions/invoice");
      for (let i = 0; i < validRecords.length; i++) {
        const merged = { ...validRecords[i].mapped, ...(overrides[i] || {}) };
        await saveInvoiceRecord(merged);
      }

    } catch (e) {
      console.error('ZIP error:', e);
      alert(`Error al generar el archivo ZIP: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsGenerating(false);
      setGenerationProgress("");
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
           <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full">
            <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Procesando</h3>
            <p className="text-slate-600 text-center">{generationProgress}</p>
           </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Vista Previa y Generación</h1>
          <p className="text-slate-500 mt-2 flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" />
            Mostrando {validRecords.length} registros listos para generar.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/validate"
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 flex items-center transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Validación
          </Link>
          <button 
            disabled={isGenerating}
            onClick={handleDownloadZip}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 flex items-center shadow-lg shadow-slate-900/20 transition-all active:scale-95"
          >
            <FileArchive className="w-4 h-4 mr-2" />
            Generar Todos (ZIP)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
            <h3 className="font-bold text-slate-800 mb-4">Acciones de Visualización</h3>
            
            <div className="flex items-center justify-between mb-6 bg-slate-50 rounded-lg p-2 border border-slate-100">
              <button 
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="p-2 rounded hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700" />
              </button>
              <span className="text-sm font-medium text-slate-600">
                {currentIndex + 1} de {validRecords.length}
              </span>
              <button 
                onClick={() => setCurrentIndex(prev => Math.min(validRecords.length - 1, prev + 1))}
                disabled={currentIndex === validRecords.length - 1}
                className="p-2 rounded hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all"
              >
                <ChevronRight className="w-5 h-5 text-slate-700" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-blue-50 text-blue-900 rounded-lg text-sm border border-blue-100">
                <span className="font-bold block mb-1">Cuentas Pendientes de:</span>
                {currentRecordMerged.conjuntoNombre}
              </div>
              
              <button 
                onClick={() => {
                  setEditForm(currentRecordMerged);
                  setIsEditing(true);
                }}
                className="w-full px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 flex justify-center items-center transition-all shadow-sm"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Editar Factura Manualmente
              </button>

              <button 
                disabled={isGenerating}
                onClick={handleDownloadSingle}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex justify-center items-center shadow-md shadow-blue-600/20 transition-all active:scale-95"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar Este PDF
              </button>
            </div>
            
            <hr className="my-6 border-slate-200" />
            
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              El diseño de esta cuenta de cobro extrae los datos de forma dinámica.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800 leading-relaxed">
              <strong>Vista Previa Real:</strong> Lo que ves a la derecha es exactamente el PDF generado. Las divisiones y estilos son idénticos al archivo que descargarás.
            </div>
          </div>
        </div>

        {/* CONTENEDOR OCULTO PARA GENERACIÓN */}
        {/* Aquí renderizamos el template real en DOM para que html2pdf lo pueda leer, pero lo ocultamos de la vista */}
        <div 
          style={{ position: 'absolute', left: '-10000px', top: 0, width: '700px', overflow: 'visible', pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <InvoiceTemplate ref={currentPreviewRef} data={currentRecordMerged} />
        </div>

        {/* VISUALIZADOR PDF REAL EN IFRAME */}
        <div className="lg:col-span-9 bg-[#404040] rounded-2xl overflow-hidden shadow-inner border border-slate-600 min-h-[600px] h-[75vh] flex flex-col relative">
          {isPreviewLoading && (
            <div className="absolute inset-0 z-10 bg-slate-800/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
              <svg className="animate-spin h-8 w-8 text-blue-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="font-medium animate-pulse">Renderizando PDF exacto...</span>
            </div>
          )}
          
          {pdfUrl ? (
            <iframe 
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`} 
              className="w-full h-full border-0"
              title="Vista Previa PDF"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              Cargando documento...
            </div>
          )}
        </div>
      </div>

      {/* Hidden container to render all components for ZIP creation */}
      {/* Use visibility:hidden + fixed position so the browser fully lays them out */}
      <div 
        ref={hiddenContainerRef}
        aria-hidden="true"
        style={{ 
          position: 'absolute', 
          left: '-10000px', 
          top: 0, 
          width: '800px',
          height: 'auto',
          overflow: 'visible',
          opacity: 0,
          pointerEvents: 'none'
        }}
      >
        {validRecords.map((record, i) => {
           const merged = { ...record.mapped, ...(overrides[i] || {}) };
           return (
             <InvoiceTemplate 
                key={`hidden-${i}`} 
                ref={(el) => {
                   if (el) hiddenRefs.current[i] = el;
                }} 
                data={merged} 
             />
           );
        })}
      </div>

      {/* Edit Modal */}
      {isEditing && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">Edición Manual (Solo en vista actual)</h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto w-full">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Cobrar A (Entidad)</label>
                <input 
                  type="text" 
                  value={editForm.conjuntoNombre || ''} 
                  onChange={(e) => setEditForm({...editForm, conjuntoNombre: e.target.value})}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">NIT</label>
                  <input 
                    type="text" 
                    value={editForm.cedula || ''} 
                    onChange={(e) => setEditForm({...editForm, cedula: e.target.value})}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Honorarios (Total)</label>
                  <input 
                    type="number" 
                    value={editForm.honorariosTotal || 0} 
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const iva = (editForm.ivaTotal || 0);
                      setEditForm({...editForm, honorariosTotal: val, granTotal: val + iva});
                    }}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">IVA (Total)</label>
                  <input 
                    type="number" 
                    value={editForm.ivaTotal || 0} 
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const hon = (editForm.honorariosTotal || 0);
                      setEditForm({...editForm, ivaTotal: val, granTotal: hon + val});
                    }}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              {/* Page Size and Orientation */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-600 uppercase mb-3 flex items-center gap-1">
                  <span>⚙️</span> Configuración de Página PDF
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tamaño de Página</label>
                    <select
                      value={pdfFormat}
                      onChange={(e) => setPdfFormat(e.target.value as PdfFormat)}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="a4">A4 (210 × 297 mm)</option>
                      <option value="letter">Carta / Letter (216 × 279 mm)</option>
                      <option value="legal">Legal (216 × 356 mm)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Orientación</label>
                    <select
                      value={pdfOrientation}
                      onChange={(e) => setPdfOrientation(e.target.value as PdfOrientation)}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="portrait">Vertical (Portrait)</option>
                      <option value="landscape">Horizontal (Landscape)</option>
                    </select>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Esta configuración aplica a todos los PDFs (descarga individual y ZIP).</p>
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm flex justify-between items-center border border-green-100">
                <span className="font-bold text-green-800">Total a Cobrar:</span>
                <span className="font-bold text-green-700 text-lg">
                  {new Intl.NumberFormat('es-CO', {style: 'currency', currency:'COP', maximumFractionDigits:0}).format(editForm.granTotal || 0)}
                </span>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancelar</button>
              <button 
                onClick={() => {
                  setOverrides(prev => ({ ...prev, [currentIndex]: editForm }));
                  setIsEditing(false);
                }} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center"
              >
                <Save className="w-4 h-4 mr-2" /> Guardar Cambios
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
