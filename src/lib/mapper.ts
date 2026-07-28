import { parseExcelDate } from "./utils";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export type RecordItem = {
  fechaPago: string | Date;
  fechaIngresoPorte: string | Date;
  fechaElaboracion: string | Date;
  predio: string; // direccion + matricula
  capital: number;
  intereses: number;
  honorarios: number;
  honorariosBase?: number;
  comisionExito?: number;
  iva: number;
  total: number;
  valorAdministracion: number;
};

export type MappedRecord = {
  nombre: string;
  cedula: string | number;
  conjuntoNombre: string;
  asesor: string;
  portafolio: string;
  consecutivo: string;
  
  // Agrupadores
  estadoCobro: string; 
  gestionMes?: number;
  gestionAnio?: number;
  fechaElaboracion?: Date | null;
  
  // Elementos de la tabla
  items: RecordItem[];

  // Totales agrupados
  capitalTotal: number;
  interesesTotal: number;
  honorariosTotal: number;
  honorariosBaseTotal?: number;
  comisionExitoTotal?: number;
  ivaTotal: number;
  granTotal: number;
};

// Intenta encontrar la propiedad en el objeto ignorando mayusculas/minusculas o espacios al inicio/final
const findCol = (row: any, ...possibleNames: string[]) => {
  const keys = Object.keys(row);
  for (const name of possibleNames) {
    const match = keys.find(k => k.trim().toLowerCase() === name.toLowerCase());
    if (match && row[match] !== undefined && row[match] !== null && row[match] !== "") {
      return row[match];
    }
  }
  return "";
};

const parseNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const num = parseFloat(String(val).replace(/,/g, '').replace(/[^\d.-]/g, ''));
  return isNaN(num) ? 0 : num;
};

export function mapRawRecord(row: any) {
  const fileRefDate = row._fileReferenceDate;
  const fileRefMonth = row._fileGestionMonth;
  const fileRefYear = row._fileGestionYear;

  const rawPortafolio = String(findCol(row, "PORTAFOLIO", "PORTAFOLIO ") || "").trim().toUpperCase();
  let portafolio = "PROPIEDAD HORIZONTAL";
  if (rawPortafolio.includes("MIXTO")) {
    portafolio = "MIXTO";
  } else if (rawPortafolio.includes("PROPIEDAD HORIZONTAL")) {
    portafolio = "PROPIEDAD HORIZONTAL";
  } else if (rawPortafolio !== "") {
    portafolio = rawPortafolio;
  } else {
    // Fallback al portafolio del usuario autenticado si no viene en el Excel
    if (typeof window !== 'undefined') {
      const storedPortafolio = localStorage.getItem('userPortafolio');
      if (storedPortafolio && storedPortafolio !== 'Todos') {
        portafolio = storedPortafolio;
      }
    }
  }
  const isMixto = portafolio === "MIXTO";

  const valorAdministracion = parseNumber(findCol(row, "Valor Administracion", "VALOR ADMINISTRACION", "VALOR ADMINISTRACIÓN", "Valor Administración", "ADMINISTRACION", "VALOR ADMIN"));
  const rawCapital = parseNumber(findCol(row, "VALOR CAPITAL", "CAPITAL"));
  const capital = isMixto ? rawCapital : (rawCapital + valorAdministracion);

  return {
    nombre: findCol(row, "NOMBRE", "NOMBRE ", "DEUDOR"),
    cedula: findCol(row, "CEDULA", "CEDULA ", "NIT", "IDENTIFICACION"),
    direccion: findCol(row, "Dirección", "Direccion", "PREDIO", "  Dirección"),
    matricula: findCol(row, "MATRICULA", "MATRICULA INMOBILIARIA"),
    conjuntoNombre: findCol(row, "CARTERA", "PORTAFOLIO", "CONJUNTO"),
    capital,
    intereses: parseNumber(findCol(row, "Abono Intereses", "INTERESES", "Abono Interes")),
    rawHonorarios: parseNumber(findCol(row, "HONORARIOS", "HONORARIOS ", "GASTOS COBRANZAS")),
    comisionExito: parseNumber(findCol(row, "Comisión Exito", "Comision Exito", "COMISION EXITO", "Comisión Éxito", "Comision de Exito", "COMISION DE EXITO")),
    honorarios: (() => {
      const rawHonorarios = parseNumber(findCol(row, "HONORARIOS", "HONORARIOS ", "GASTOS COBRANZAS"));
      const comisionExito = parseNumber(findCol(row, "Comisión Exito", "Comision Exito", "COMISION EXITO", "Comisión Éxito", "Comision de Exito", "COMISION DE EXITO"));
      const conjunto = String(findCol(row, "CARTERA", "PORTAFOLIO", "CONJUNTO")).trim().toUpperCase();
      const isTole = conjunto.includes("TOLE") || conjunto.includes("DISTRIBUCIONES TOLE");
      return isTole ? (rawHonorarios + comisionExito) : rawHonorarios;
    })(),
    iva: (() => {
      const rawIva = parseNumber(findCol(row, "IVA", "IVA "));
      const iva2 = parseNumber(findCol(row, "IVA2", "IVA 2", "IVA2 "));
      const conjunto = String(findCol(row, "CARTERA", "PORTAFOLIO", "CONJUNTO")).trim().toUpperCase();
      const isTole = conjunto.includes("TOLE") || conjunto.includes("DISTRIBUCIONES TOLE");
      return isTole ? (rawIva + iva2) : rawIva;
    })(),
    total: parseNumber(findCol(row, "TOTAL", "TOTAL ", "VALOR TOTAL", "TOTAL A PAGAR")),
    valorAdministracion,
    fechaPago: findCol(row, "Fecha ingreso dinero", "FECHA INGRESO DINERO", "FECHA INGRESO DEL DINERO", "FECHA INGRESO", "FECHA DE PAGO", "FECHA PAGO", "FECHA"),
    fechaIngreso: findCol(row, "Fecha ingreso dinero", "FECHA INGRESO DINERO", "FECHA INGRESO DEL DINERO", "FECHA INGRESO"),
    fechaElaboracion: findCol(row, "FECHA ELABORACION", "FECHA CREACION", "FECHA CUENTA DE COBRO", "FECHA DE CREACION", "FECHA DE ENVIO", "FECHA ENVIO") || fileRefDate,
    estadoCobro: findCol(row, "CUENTA DE COBRO", "CUENTA DE COBRO "),
    asesor: findCol(row, "ASESOR", "ASESOR ", "ASESORA"),
    portafolio,
    
    // Extracción de Gestión (Directo del archivo)
    archivoGestionMes: findCol(row, "GESTION", "MES GESTION", "CICLO", "MES GESTIÓN"),
    archivoGestionAnio: findCol(row, "ANIO GESTION", "AÑO GESTION", "AÑO", "ANIO"),

    originalRow: row
  };
}

export function groupRecords(
  rawRows: any[], 
  startingConsecutive: number = 1,
  options: { comisionExitoMode?: 'junto' | 'separado' } = {}
): MappedRecord[] {
  const mode = options.comisionExitoMode || 'junto';
  const grouped = new Map<string, MappedRecord>();
  let consecutivoCounter = startingConsecutive;

  const addItemToGroup = (groupKey: string, mapped: any, item: RecordItem, raw: any) => {
    if (grouped.has(groupKey)) {
      const existing = grouped.get(groupKey)!;
      existing.items.push(item);
      existing.capitalTotal += item.capital;
      existing.interesesTotal += item.intereses;
      existing.honorariosTotal += item.honorarios;
      existing.honorariosBaseTotal = (existing.honorariosBaseTotal || 0) + (item.honorariosBase || 0);
      existing.comisionExitoTotal = (existing.comisionExitoTotal || 0) + (item.comisionExito || 0);
      existing.ivaTotal += item.iva;
      existing.granTotal += item.honorarios + item.iva;
    } else {
      let gMes: number = raw._fileGestionMonth || (mapped.archivoGestionMes ? parseInt(String(mapped.archivoGestionMes)) : null);
      let gAnio: number = raw._fileGestionYear || (mapped.archivoGestionAnio ? parseInt(String(mapped.archivoGestionAnio)) : null);
      
      if (!gMes || !gAnio) {
        const dPago = parseExcelDate(mapped.fechaPago);
        if (dPago) {
          gMes = gMes || (dPago.getMonth() + 1);
          gAnio = gAnio || dPago.getFullYear();
        }
      }

      grouped.set(groupKey, {
        nombre: mapped.nombre,
        cedula: mapped.cedula,
        conjuntoNombre: groupKey,
        asesor: mapped.asesor,
        portafolio: mapped.portafolio,
        estadoCobro: mapped.estadoCobro,
        gestionMes: gMes,
        gestionAnio: gAnio,
        consecutivo: String(new Date().getFullYear()) + "-" + String(consecutivoCounter).padStart(4, '0'),
        items: [item],
        capitalTotal: item.capital,
        interesesTotal: item.intereses,
        honorariosTotal: item.honorarios,
        honorariosBaseTotal: item.honorariosBase || 0,
        comisionExitoTotal: item.comisionExito || 0,
        ivaTotal: item.iva,
        granTotal: item.honorarios + item.iva
      });
      consecutivoCounter++;
    }
  };

  for (const raw of rawRows) {
    const mapped = mapRawRecord(raw);
    
    // FILTRO ESTRICTO: Solo procesamos los que tienen cuenta de cobro PENDIENTE.
    if (!mapped.estadoCobro || typeof mapped.estadoCobro !== 'string' || !mapped.estadoCobro.trim().toUpperCase().includes('PENDIENTE')) {
        continue; 
    }

    const conjunto = mapped.conjuntoNombre || 'CONJUNTO NO ESPECIFICADO';
    const isTole = conjunto.trim().toUpperCase().includes('TOLE');

    const comisionExito = parseNumber(findCol(raw, "Comisión Exito", "Comision Exito", "COMISION EXITO", "Comisión Éxito", "Comision de Exito"));
    const iva2 = parseNumber(findCol(raw, "IVA2", "IVA 2"));

    if (isTole && comisionExito > 0 && mode === 'separado') {
      const rawHonorarios = parseNumber(findCol(raw, "HONORARIOS", "HONORARIOS ", "GASTOS COBRANZAS"));
      const rawIva = parseNumber(findCol(raw, "IVA", "IVA "));

      // 1. Cuenta principal (Honorarios Base)
      const mainItem: RecordItem = {
        fechaPago: mapped.fechaPago,
        fechaIngresoPorte: mapped.fechaIngreso,
        fechaElaboracion: mapped.fechaElaboracion,
        predio: `${mapped.direccion} ${mapped.matricula ? `(${mapped.matricula})` : ''}`.trim(),
        capital: mapped.capital,
        intereses: mapped.intereses,
        honorarios: rawHonorarios,
        honorariosBase: rawHonorarios,
        comisionExito: 0,
        iva: rawIva,
        total: mapped.capital + mapped.intereses + rawHonorarios + rawIva,
        valorAdministracion: mapped.valorAdministracion
      };
      addItemToGroup(conjunto, mapped, mainItem, raw);

      // 2. Cuenta separada (Comisión Éxito)
      const exitoGroupKey = `${conjunto} (COMISIÓN ÉXITO)`;
      const exitoItem: RecordItem = {
        fechaPago: mapped.fechaPago,
        fechaIngresoPorte: mapped.fechaIngreso,
        fechaElaboracion: mapped.fechaElaboracion,
        predio: `${mapped.direccion} ${mapped.matricula ? `(${mapped.matricula})` : ''} - Comisión Éxito`.trim(),
        capital: 0,
        intereses: 0,
        honorarios: comisionExito,
        honorariosBase: 0,
        comisionExito: comisionExito,
        iva: iva2,
        total: comisionExito + iva2,
        valorAdministracion: 0
      };
      addItemToGroup(exitoGroupKey, mapped, exitoItem, raw);
    } else if (isTole && comisionExito > 0 && mode === 'junto') {
      const rawHonorarios = parseNumber(findCol(raw, "HONORARIOS", "HONORARIOS ", "GASTOS COBRANZAS"));
      const rawIva = parseNumber(findCol(raw, "IVA", "IVA "));

      // 1. Renglón 1 (Pago Deudor): Capital + Honorarios Base + IVA Base = Cuadrado con lo que pagó el deudor (p.ej. 1.400.000)
      const mainItem: RecordItem = {
        fechaPago: mapped.fechaPago,
        fechaIngresoPorte: mapped.fechaIngreso,
        fechaElaboracion: mapped.fechaElaboracion,
        predio: `${mapped.direccion} ${mapped.matricula ? `(${mapped.matricula})` : ''}`.trim(),
        capital: mapped.capital,
        intereses: mapped.intereses,
        honorarios: rawHonorarios,
        honorariosBase: rawHonorarios,
        comisionExito: 0,
        iva: rawIva,
        total: mapped.capital + mapped.intereses + rawHonorarios + rawIva,
        valorAdministracion: mapped.valorAdministracion
      };
      addItemToGroup(conjunto, mapped, mainItem, raw);

      // 2. Renglón 2 (Comisión de Éxito más IVA): Renglón abajo en la misma factura
      const exitoItem: RecordItem = {
        fechaPago: mapped.fechaPago,
        fechaIngresoPorte: mapped.fechaIngreso,
        fechaElaboracion: mapped.fechaElaboracion,
        predio: "Comisión Éxito + IVA",
        capital: 0,
        intereses: 0,
        honorarios: comisionExito,
        honorariosBase: 0,
        comisionExito: comisionExito,
        iva: iva2,
        total: comisionExito + iva2,
        valorAdministracion: 0
      };
      addItemToGroup(conjunto, mapped, exitoItem, raw);
    } else {
      // Modo 'junto' estándar (sin comisión de éxito o no es Tole)
      const rawHonorarios = parseNumber(findCol(raw, "HONORARIOS", "HONORARIOS ", "GASTOS COBRANZAS"));
      const item: RecordItem = {
        fechaPago: mapped.fechaPago,
        fechaIngresoPorte: mapped.fechaIngreso,
        fechaElaboracion: mapped.fechaElaboracion,
        predio: `${mapped.direccion} ${mapped.matricula ? `(${mapped.matricula})` : ''}`.trim(),
        capital: mapped.capital,
        intereses: mapped.intereses,
        honorarios: mapped.honorarios,
        honorariosBase: isTole ? rawHonorarios : mapped.honorarios,
        comisionExito: isTole ? comisionExito : 0,
        iva: mapped.iva,
        total: mapped.total,
        valorAdministracion: mapped.valorAdministracion
      };
      addItemToGroup(conjunto, mapped, item, raw);
    }
  }

  return Array.from(grouped.values());
}

export function validateRecord(mapped: MappedRecord): ValidationResult {
  const errors: string[] = [];

  if (!mapped.conjuntoNombre || mapped.conjuntoNombre === 'CONJUNTO NO ESPECIFICADO') errors.push("Nombre del conjunto faltante");
  if (mapped.granTotal <= 0) errors.push("Total del conjunto inválido o faltante");
  if (mapped.items.length === 0) errors.push("No hay registros pendientes para agrupar");

  return {
    isValid: errors.length === 0,
    errors
  };
}
