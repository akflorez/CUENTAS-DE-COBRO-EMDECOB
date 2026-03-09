import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Importación dinámica para evitar errores SSR de "window is not defined".
// Asumimos uso en cliente (useEffect/gestores de estado UI).
export type PdfFormat = 'a4' | 'letter' | 'legal';
export type PdfOrientation = 'portrait' | 'landscape';

/**
 * Función centralizada de html2pdf para reutilizar opciones gráficas idénticas en descargas simples y por ZIP.
 */
const getPdfEngineConfig = (filename: string, format: PdfFormat, orientation: PdfOrientation) => {
  return {
    margin:       [12, 10, 12, 10] as [number, number, number, number],
    filename:     filename,
    image:        { type: 'jpeg' as const, quality: 1 },
    html2canvas:  { scale: 2, useCORS: true, logging: false, windowWidth: 700 },
    jsPDF:        { unit: 'mm', format: format, orientation: orientation, compress: true },
    pagebreak:    { mode: ['css'] }
  };
};

/**
 * Convierte un elemento HTML continuo en un archivo PDF paginado automáticamente y lo descarga.
 */
export const downloadPdf = async (
  element: HTMLElement,
  filename: string,
  format: PdfFormat = 'letter',
  orientation: PdfOrientation = 'portrait'
): Promise<void> => {
  // @ts-ignore
  const html2pdf = (await import('html2pdf.js')).default;
  const opt = getPdfEngineConfig(filename, format, orientation);
  
  await html2pdf().from(element).set(opt).save();
};

/**
 * Genera el Blob del PDF para su previsualización en el navegador sin descargarlo.
 */
export const generatePdfBlob = async (
  element: HTMLElement,
  format: PdfFormat = 'letter',
  orientation: PdfOrientation = 'portrait'
): Promise<Blob> => {
  // @ts-ignore
  const html2pdf = (await import('html2pdf.js')).default;
  const opt = getPdfEngineConfig('preview.pdf', format, orientation);
  
  return await html2pdf().from(element).set(opt).output('blob');
};

/**
 * Convierte múltiples elementos continuos en PDFs paginados individualmente y los comprime en un ZIP.
 */
export const downloadPdfsAsZip = async (
  elements: HTMLElement[],
  filenames: string[],
  zipName: string,
  format: PdfFormat = 'letter',
  orientation: PdfOrientation = 'portrait'
): Promise<void> => {
  const zip = new JSZip();
  const folder = zip.folder('cuentas_de_cobro');
  if (!folder) return;

  // @ts-ignore
  const html2pdf = (await import('html2pdf.js')).default;

  for (let i = 0; i < elements.length; i++) {
    const opt = getPdfEngineConfig(filenames[i], format, orientation);
    // output('blob') devuelve la promesa con el blob binario del PDF
    const pdfBlob = await html2pdf().from(elements[i]).set(opt).output('blob');
    folder.file(filenames[i], pdfBlob);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, zipName);
};

export const getPdfBlob = async (
  element: HTMLElement,
  filename: string,
  format: PdfFormat = 'letter',
  orientation: PdfOrientation = 'portrait'
): Promise<Blob> => {
  // @ts-ignore
  const html2pdf = (await import('html2pdf.js')).default;
  const opt = getPdfEngineConfig(filename, format, orientation);
  return await html2pdf().from(element).set(opt).output('blob');
};
