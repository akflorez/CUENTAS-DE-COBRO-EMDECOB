"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { UploadCloud, CheckCircle2, FileSpreadsheet, FileWarning, Send, Mail, Settings, Lock } from "lucide-react";
import { validateRecord, groupRecords } from "@/lib/mapper";
import { getPdfBlob } from "@/lib/pdfGenerator";
import { InvoiceTemplate } from "@/components/InvoiceTemplate";
import { cn } from "@/lib/utils";

// Componente para la UI principal
export default function EmailingPage() {
  const router = useRouter();
  const { excelData, directoryData, setDirectoryData, startingConsecutive } = useAppContext();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  
  const hiddenRefs = React.useRef<{ [key: number]: HTMLDivElement }>({});
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpError, setSmtpError] = useState("");

  // Cargar credenciales guardadas al montar
  React.useEffect(() => {
    const savedUser = localStorage.getItem("emde_smtp_user");
    const savedPass = localStorage.getItem("emde_smtp_pass");
    if (savedUser) setSmtpUser(savedUser);
    if (savedPass) setSmtpPass(savedPass);
  }, []);

  // Guardar credenciales al cambiar
  React.useEffect(() => {
    if (smtpUser) localStorage.setItem("emde_smtp_user", smtpUser);
    if (smtpPass) localStorage.setItem("emde_smtp_pass", smtpPass);
  }, [smtpUser, smtpPass]);
  
  const [sendingState, setSendingState] = useState<{
    isActive: boolean;
    progress: number;
    total: number;
    currentName: string;
    completed: boolean;
  }>({
    isActive: false, progress: 0, total: 0, currentName: "", completed: false
  });

  // Valid records that have invoices ready
  const validInvoices = useMemo(() => {
    if (!excelData) return [];
    return groupRecords(excelData, startingConsecutive).map((mapped) => ({ 
      ...validateRecord(mapped), 
      mapped 
    })).filter(r => r.isValid);
  }, [excelData, startingConsecutive]);

  // Matches emails to pending invoices
  const emailMapping = useMemo(() => {
    return validInvoices.map(invoice => {
      // Intentamos cruzar por Nombre primero, sino por NIT/Cedula
      const cleanConjunto = (invoice.mapped.conjuntoNombre || "").toLowerCase().trim();
      const invoiceNit = String(invoice.mapped.cedula || "").trim();
      
      const targetDir = directoryData.find(dir => {
         const pName = String(dir.CONJUNTO || dir.NOMBRE || dir.ENTIDAD || "").toLowerCase().trim();
         const pNit = String(dir.NIT || dir.CEDULA || "").trim();
         
         // Match if either one contains the other
         const nameMatch = pName && cleanConjunto && (cleanConjunto.includes(pName) || pName.includes(cleanConjunto));
         const nitMatch = pNit && invoiceNit && pNit === invoiceNit;
         
         return nameMatch || nitMatch;
      });

      return {
        invoice,
        associatedEmail: targetDir?.CORREO || targetDir?.EMAIL || targetDir?.correo || targetDir?.Email || null,
        directoryRecord: targetDir || null
      };
    });
  }, [validInvoices, directoryData]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorInfo(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Parsear JSON con cabeceras correctas
        const rawJson = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        // Normalizar los nombres de las columnas (keys) a mayúsculas
        const json = rawJson.map(row => {
          const newRow: any = {};
          for (const key in row) {
            if (Object.prototype.hasOwnProperty.call(row, key)) {
              newRow[key.toUpperCase().trim()] = row[key];
            }
          }
          return newRow;
        });
        
        if (json.length === 0) throw new Error("El archivo Excel está vacío.");
        
        setDirectoryData(json);
      } catch (err) {
        console.error(err);
        setErrorInfo(err instanceof Error ? err.message : "Error al procesar el Excel.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setErrorInfo("No se pudo leer el archivo físico.");
      setIsProcessing(false);
    };
    reader.readAsArrayBuffer(file);
  }, [setDirectoryData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  const readyToSend = emailMapping.filter(em => em.associatedEmail !== null);

  const handleSimulateEmails = async () => {
    if (readyToSend.length === 0) return;
    if (!smtpUser || !smtpPass) {
        setSmtpError("Por favor ingresa el correo emitente y la contraseña de aplicación.");
        return;
    }
    
    setSmtpError("");
    setSendingState(prev => ({ ...prev, isActive: true, total: readyToSend.length, progress: 0, completed: false }));
    
    for (let i = 0; i < readyToSend.length; i++) {
        const match = readyToSend[i];
        setSendingState(prev => ({ ...prev, currentName: match.invoice.mapped.conjuntoNombre, progress: i + 1 }));
        
        try {
            const invoiceElement = hiddenRefs.current[i];
            if (!invoiceElement) throw new Error("Plantilla oculta no encontrada en la memoria.");

            // Tomar la captura en Blob de cada pagina
            const blob = await getPdfBlob(invoiceElement, `Cuenta_Cobro_${match.invoice.mapped.conjuntoNombre}`, 'letter', 'portrait');
            
            // Adjuntar al form data
            const formData = new FormData(); 
            formData.append('pdf', blob, `Cuenta_Cobro_${match.invoice.mapped.conjuntoNombre}.pdf`); 
            formData.append('email', match.associatedEmail!);
            formData.append('conjunto', match.invoice.mapped.conjuntoNombre || 'Conjunto');
            formData.append('smtpUser', smtpUser);
            formData.append('smtpPass', smtpPass);

            // Fetch a nuestro backend
            const res = await fetch('/api/send-email', { method: 'POST', body: formData });
            
            if (!res.ok) {
                const result = await res.json();
                console.error("Error en envío:", result.error);
                // Si la credencial falla por completo, tal vez queramos detener el bucle
                if (res.status === 500 && String(result.error).includes("auth") || String(result.error).includes("SMTP")) {
                    setSmtpError("Tus credenciales SMTP fueron rechazadas por Gmail/Servidor.");
                    setSendingState(prev => ({ ...prev, isActive: false }));
                    return;
                }
            } else {
                // Guardar en la base de datos
                const { saveInvoiceRecord } = await import("@/app/actions/invoice");
                await saveInvoiceRecord(match.invoice.mapped);
            }
            
            // Pausa de cortesía para no colapsar la memoria del cliente ni ser bloqueado por Spam limits
            await new Promise(r => setTimeout(r, 600));

        } catch (e) {
            console.error(e);
        }
    }

    setSendingState(prev => ({ ...prev, isActive: false, completed: true }));
  };


  if (validInvoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-slate-200">
        <FileWarning className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">No hay facturas listas</h2>
        <p className="text-slate-500 max-w-md text-center mt-2 mb-6">Debes subir y validar tu data de Gestión de Cartera antes de poder cruzarla con el directorio de correos.</p>
        <button onClick={() => router.push("/dashboard/upload")} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Ir a Cargar Datos</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Envío Masivo de Cuentas</h1>
        <p className="text-slate-500 mt-2 flex items-center">
          <Send className="w-4 h-4 mr-2" />
          Modulo automático de vinculación de correos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LADO IZQUIERDO: CARGUE DEL DIRECTORIO */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
             <h3 className="font-bold text-slate-800 mb-2">1. Directorio de Correos (Excel)</h3>
             <p className="text-sm text-slate-500 mb-6">
                Sube un Excel que tenga las columnas <strong className="text-slate-700">CONJUNTO</strong> o <strong className="text-slate-700">NIT</strong>, 
                y una columna llamada <strong className="text-slate-700">CORREO</strong> para cruzar la base de datos automáticamente.
             </p>

             <div 
                {...getRootProps()} 
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 relative overflow-hidden group",
                  isDragActive ? "border-emerald-500 bg-emerald-50" : "border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/30",
                  directoryData.length > 0 && "border-emerald-500 bg-emerald-50"
                )}
              >
                <input {...getInputProps()} />
                
                {directoryData.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1">Directorio Cargado</h3>
                    <p className="text-emerald-600 font-medium mb-1">{directoryData.length} registros encontrados</p>
                    <p className="text-xs text-slate-400 mt-4 underline decoration-dashed">Haz clic para reemplazar archivo</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">
                       {isDragActive ? "Suelta el Excel aquí..." : "Arrastra el Directorio Excel"}
                    </h3>
                    <p className="text-sm text-slate-500 max-w-[250px] mx-auto">
                       Soporta archivos .xlsx o .xls
                    </p>
                  </div>
                )}
                
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  </div>
                )}
              </div>
              
              {errorInfo && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200 text-sm text-red-700 flex items-start">
                  <FileWarning className="w-5 h-5 mr-2 shrink-0" />
                  <p>{errorInfo}</p>
                </div>
              )}
          </div>

          <div className="bg-emerald-50 rounded-xl shadow-sm border border-emerald-200 p-6 flex flex-col justify-center">
              <p className="text-sm font-medium text-emerald-800 mb-2 leading-relaxed">
                  El sistema cuenta con <strong>{validInvoices.length} recibos de cobro validados</strong>. 
                  Una vez subas el directorio de contactos con sus respectivos correos, la plataforma generará el PDF y emparejará el documento.
              </p>
          </div>
        </div>


        {/* LADO DERECHO: CONSOLIDADO Y ENVIO */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
             
             <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-800">2. Cuentas Listas para Envío</h3>
               <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 flex items-center shadow-sm">
                 <Mail className="w-3.5 h-3.5 mr-1.5 text-blue-500"/>
                 {readyToSend.length} de {validInvoices.length} listas
               </div>
             </div>

             <div className="flex-1 overflow-y-auto p-0 min-h-[400px]">
                {directoryData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center min-h-[300px]">
                        <FileSpreadsheet className="w-12 h-12 mb-3 opacity-50" />
                        <p>Carga el directorio en el panel izquierdo para previsualizar los destinatarios calculados.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-5 py-3 font-semibold">Destinatario</th>
                                <th className="px-5 py-3 font-semibold">Cruce Correo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {emailMapping.map((match, idx) => (
                                <tr key={idx} className={cn("hover:bg-slate-50/50 transition-colors", !match.associatedEmail && "bg-amber-50/30")}>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center">
                                            <div className={cn("w-2 h-2 rounded-full mr-3 shrink-0", match.associatedEmail ? "bg-green-500" : "bg-amber-400")}></div>
                                            <div>
                                                <p className="font-bold text-slate-800 leading-none mb-1">{match.invoice.mapped.conjuntoNombre || 'N/A'}</p>
                                                <p className="text-[10px] text-slate-500 font-medium">NIT: {match.invoice.mapped.cedula || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        {match.associatedEmail ? (
                                            <span className="flex items-center text-blue-600 font-medium text-xs">
                                                <Mail className="w-3.5 h-3.5 mr-1.5 shrink-0"/>
                                                {match.associatedEmail}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-amber-600 italic bg-amber-100/50 px-2 py-1 rounded-md">
                                                No se encontró cruce
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
             </div>

             {/* ACCION DE ENVIO */}
             <div className="p-6 border-t border-slate-100 bg-slate-50">
                 {!sendingState.isActive && !sendingState.completed && (
                     <div className="mb-6 bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
                         <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center">
                             <Settings className="w-4 h-4 mr-2 text-slate-500"/> Configuración de Envío SMTP (Gmail)
                         </h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div>
                                 <label className="block text-xs font-bold text-slate-600 mb-1">Correo Remitente (Usuario)</label>
                                 <input 
                                     type="email" 
                                     value={smtpUser}
                                     onChange={e => setSmtpUser(e.target.value)}
                                     placeholder="ej. cartera@emdecob.com"
                                     className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                 />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center">
                                     <Lock className="w-3 h-3 mr-1"/> Contraseña de Aplicación
                                 </label>
                                 <input 
                                     type="password" 
                                     value={smtpPass}
                                     onChange={e => setSmtpPass(e.target.value)}
                                     placeholder="Contraseña de 16 dígitos"
                                     className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                 />
                             </div>
                         </div>
                         {smtpError && <p className="text-xs text-red-500 font-medium mt-2 animate-pulse">{smtpError}</p>}
                     </div>
                 )}

                 {!sendingState.isActive && !sendingState.completed ? (
                    <button 
                        onClick={handleSimulateEmails}
                        disabled={readyToSend.length === 0}
                        className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98]"
                    >
                        <Send className="w-5 h-5 mr-2" />
                        Disparar {readyToSend.length} Correos Automáticos
                    </button>
                 ) : sendingState.isActive ? (
                    <div className="w-full py-4 px-6 bg-white border border-blue-200 rounded-xl shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-bold text-slate-700 flex items-center">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-2"></span>
                                Generando y Enviando...
                            </span>
                            <span className="text-sm font-medium text-blue-600">{sendingState.progress} / {sendingState.total}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(sendingState.progress / sendingState.total) * 100}%` }}></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-3 text-center truncate">
                            Procesando PDF: <strong className="text-slate-700">{sendingState.currentName}</strong>
                        </p>
                    </div>
                 ) : (
                    <div className="w-full py-4 px-6 bg-green-600 text-white rounded-xl shadow-lg shadow-green-600/20 text-center flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 mr-3" />
                        <span className="font-bold">¡Campaña finalizada exitosamente!</span>
                    </div>
                 )}
                 <p className="text-center text-[10px] text-slate-400 mt-3">Los envíos se realizarán adjuntando el PDF de pre-validación (Formato Carta Oficial).</p>
             </div>

          </div>
        </div>

      </div>

      {/* Contenedor Oculto para Renderizar las Plantillas PDF en el DOM */}
      <div 
        id="hidden-pdf-pool"
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
        {readyToSend.map((match, i) => {
           return (
             <InvoiceTemplate 
                key={`hidden-email-${i}`} 
                ref={(el) => {
                   if (el) hiddenRefs.current[i] = el;
                }} 
                data={match.invoice.mapped} 
             />
           );
        })}
      </div>

    </div>
  );
}
