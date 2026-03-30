export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export type RecordItem = {
  fechaPago: string | Date;
  predio: string; // direccion + matricula
  capital: number;
  intereses: number;
  honorarios: number;
  iva: number;
  total: number;
};

export type MappedRecord = {
  nombre: string; // Ya no debe aparecer el nombre en la plantilla, pero se conserva logicamente si se requiere
  cedula: string | number;
  conjuntoNombre: string; // CARTERA
  asesor: string;
  consecutivo: string;
  
  // Agrupadores obligados
  estadoCobro: string; // CUENTA DE COBRO (PENDIENTE)
  
  // Elementos de la tabla
  items: RecordItem[];

  // Totales agrupados
  capitalTotal: number;
  interesesTotal: number;
  honorariosTotal: number;
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
  return {
    nombre: findCol(row, "NOMBRE", "NOMBRE ", "DEUDOR"),
    cedula: findCol(row, "CEDULA", "CEDULA ", "NIT", "IDENTIFICACION"),
    direccion: findCol(row, "Dirección", "Direccion", "PREDIO", "  Dirección"),
    matricula: findCol(row, "MATRICULA", "MATRICULA INMOBILIARIA"),
    conjuntoNombre: findCol(row, "CARTERA", "PORTAFOLIO", "CONJUNTO"),
    capital: parseNumber(findCol(row, "VALOR CAPITAL", "CAPITAL")),
    intereses: parseNumber(findCol(row, "Abono Intereses", "INTERESES", "Abono Interes")),
    honorarios: parseNumber(findCol(row, "HONORARIOS", "HONORARIOS ", "GASTOS COBRANZAS")),
    iva: parseNumber(findCol(row, "IVA", "IVA ")),
    total: parseNumber(findCol(row, "TOTAL", "TOTAL ", "VALOR TOTAL", "TOTAL A PAGAR")),
    fechaPago: findCol(row, "FECHA INGRESO DINERO", "FECHA INGRESO DEL DINERO", "FECHA INGRESO", "FECHA DE PAGO", "FECHA PAGO", "FECHA"),
    estadoCobro: findCol(row, "CUENTA DE COBRO", "CUENTA DE COBRO "),
    asesor: findCol(row, "ASESOR", "ASESOR ", "ASESORA"),
    originalRow: row
  };
}

export function groupRecords(rawRows: any[], startingConsecutive: number = 1): MappedRecord[] {
  const grouped = new Map<string, MappedRecord>();
  let consecutivoCounter = startingConsecutive;

  for (const raw of rawRows) {
    const mapped = mapRawRecord(raw);
    
    // FILTRO ESTRICTO: Solo procesamos los que tienen cuenta de cobro PENDIENTE.
    // Ignoramos celdas vacias, no existenes, o cualquier otro estado.
    if (!mapped.estadoCobro || typeof mapped.estadoCobro !== 'string' || !mapped.estadoCobro.trim().toUpperCase().includes('PENDIENTE')) {
        continue; 
    }

    const conjunto = mapped.conjuntoNombre || 'CONJUNTO NO ESPECIFICADO';
    
    // Crear el item para la tabla
    const item: RecordItem = {
      fechaPago: mapped.fechaPago,
      predio: `${mapped.direccion} ${mapped.matricula ? `(${mapped.matricula})` : ''}`.trim(),
      capital: mapped.capital,
      intereses: mapped.intereses,
      honorarios: mapped.honorarios,
      iva: mapped.iva,
      total: mapped.total
    };

    if (grouped.has(conjunto)) {
      const existing = grouped.get(conjunto)!;
      existing.items.push(item);
      existing.capitalTotal += item.capital;
      existing.interesesTotal += item.intereses;
      existing.honorariosTotal += item.honorarios;
      existing.ivaTotal += item.iva;
      // granTotal = solo lo que se cobra: Honorarios + IVA
      existing.granTotal += item.honorarios + item.iva;
    } else {
      grouped.set(conjunto, {
        nombre: mapped.nombre,
        cedula: mapped.cedula,
        conjuntoNombre: conjunto,
        asesor: mapped.asesor,
        estadoCobro: mapped.estadoCobro,
        consecutivo: String(new Date().getFullYear()) + "-" + String(consecutivoCounter).padStart(4, '0'),
        items: [item],
        capitalTotal: item.capital,
        interesesTotal: item.intereses,
        honorariosTotal: item.honorarios,
        ivaTotal: item.iva,
        // granTotal = solo lo que se cobra: Honorarios + IVA
        granTotal: item.honorarios + item.iva
      });
      consecutivoCounter++;
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
