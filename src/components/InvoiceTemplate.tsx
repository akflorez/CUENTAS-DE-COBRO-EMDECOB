import React from 'react';
import { MappedRecord } from '@/lib/mapper';

interface Props {
  data: MappedRecord;
}

/**
 * NOTAS DE DISEÑO PARA PDF:
 * - El ancho del contenido se fija en 700px para que quepa en página Carta a escala 2 sin recortes.
 *   (Carta = 216mm; con márgenes 10mm c/u = 196mm. A 96dpi = ~745px; con scale:2 se renderiza a ~745px).
 *   Usamos 700px con padding interno para tener margen de seguridad.
 * - NO se usan clases html2pdf__page-break en filas porque eso fuerza a la tabla entera a la siguiente hoja.
 * - Se usa page-break-inside: avoid solo en el bloque de firma+totales para que no se corte a la mitad.
 * - El contenedor raíz NO tiene fondo gris ni padding externo para que html2pdf no mida mal el contenido.
 */
export const InvoiceTemplate = React.forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(val));
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return new Date().toLocaleDateString('es-CO');
    if (dateValue instanceof Date) return dateValue.toLocaleDateString('es-CO');
    if (typeof dateValue === 'number') {
      const date = new Date((dateValue - (25567 + 1)) * 86400 * 1000);
      if (!isNaN(date.getTime())) return date.toLocaleDateString('es-CO');
    }
    return String(dateValue).substring(0, 10);
  };

  return (
    // Contenedor raíz: sin padding/fondo para que html2pdf mida bien el ancho real
    <div
      ref={ref}
      style={{
        width: '700px',
        margin: '0 auto',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: '#1e293b',
        backgroundColor: '#ffffff',
        padding: '32px 36px',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Esquina decorativa */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: '100px', height: '100px',
        backgroundColor: '#16a34a',
        borderBottomLeftRadius: '100px',
        opacity: 0.08,
        pointerEvents: 'none',
      }} />

      {/* ===== HEADER ===== */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        borderBottom: '2px solid #dcfce7',
        paddingBottom: '12px',
        marginBottom: '14px',
      }}>
        {/* Logo izquierda */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src="/assets/logo.png"
            alt="EMDECOB"
            style={{ height: '52px', objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <img src="/assets/logo-verde-1.png" alt="" style={{ height: '36px', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <img src="/assets/logo-verde-2.png" alt="" style={{ height: '36px', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>

        {/* Centro: título */}
        <div style={{ textAlign: 'center', flex: 1, padding: '0 12px' }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1e293b' }}>
            Cuenta de Cobro
          </h1>
          <div style={{ display: 'inline-block', marginTop: '4px', padding: '2px 12px', borderRadius: '999px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', fontWeight: 700, fontSize: '12px' }}>
            N° {data.consecutivo}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#64748b' }}>
            Servicio Integral de Cobranza y Asesoría Jurídica<br />NIT: 900.294.018-8
          </p>
        </div>

        {/* Fecha derecha */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha Emisión</p>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#334155' }}>{formatDate(new Date())}</p>
        </div>
      </div>

      {/* ===== COBRAR A ===== */}
      <div style={{ marginBottom: '12px', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fff' }}>
        <p style={{ margin: '0 0 2px', fontSize: '9px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cobrar A (Entidad):</p>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>{data.conjuntoNombre}</h3>
      </div>

      {/* ===== TEXTO CONCEPTO ===== */}
      <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#475569', textAlign: 'justify', lineHeight: 1.6 }}>
        Por concepto de gastos de cobranza y compromisos de pago correspondientes a la gestión realizada para la cartera del conjunto residencial mencionado, se detalla a continuación el estado de cuenta y relación de pagos.
      </p>

      {/* ===== TABLA DE ITEMS — flujo natural ===== */}
      <div style={{ marginBottom: '14px', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden', fontSize: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '12%' }} />
            <col style={{ width: '26%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '14%' }} />
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '7px 6px', fontWeight: 700, color: '#475569' }}>Fecha Pago</th>
              <th style={{ padding: '7px 6px', fontWeight: 700, color: '#475569' }}>Predio</th>
              <th style={{ padding: '7px 6px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Abono Cap.</th>
              <th style={{ padding: '7px 6px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Intereses</th>
              <th style={{ padding: '7px 6px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Gasto Cobr.</th>
              <th style={{ padding: '7px 6px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>IVA</th>
              <th style={{ padding: '7px 6px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => (
              <tr key={idx} className="pdf-item-row" style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <td style={{ padding: '5px 6px', color: '#475569', wordBreak: 'break-word' }}>{formatDate(item.fechaPago)}</td>
                <td style={{ padding: '5px 6px', color: '#334155', wordBreak: 'break-word' }}>{item.predio}</td>
                <td style={{ padding: '5px 6px', textAlign: 'right', color: '#475569' }}>{formatCurrency(item.capital)}</td>
                <td style={{ padding: '5px 6px', textAlign: 'right', color: '#475569' }}>{formatCurrency(item.intereses)}</td>
                <td style={{ padding: '5px 6px', textAlign: 'right', color: '#475569' }}>{formatCurrency(item.honorarios)}</td>
                <td style={{ padding: '5px 6px', textAlign: 'right', color: '#475569' }}>{formatCurrency(item.iva)}</td>
                <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#f1f5f9', borderTop: '2px solid #cbd5e1', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <td colSpan={2} style={{ padding: '6px 8px', fontWeight: 700, color: '#64748b', fontSize: '9px', textAlign: 'right', fontStyle: 'italic' }}>Subtotales</td>
              <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>{formatCurrency(data.capitalTotal)}</td>
              <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>{formatCurrency(data.interesesTotal)}</td>
              <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>{formatCurrency(data.honorariosTotal)}</td>
              <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>{formatCurrency(data.ivaTotal)}</td>
              <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>—</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ===== BLOQUE FINAL: TOTALES + PAGO + FIRMA ===== */}
      <div className="pdf-no-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>

        {/* Caja total */}
        <div style={{ marginBottom: '12px', border: '2px solid #16a34a', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ backgroundColor: '#16a34a', padding: '8px 14px' }}>
            <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total a Cobrar por EMDECOB S.A.S</p>
            <p style={{ margin: '1px 0 0', color: '#bbf7d0', fontSize: '9px' }}>Gastos de Cobranza + IVA</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: '10px 16px' }}>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '9px' }}>Gastos de Cobranza</p>
                <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>{formatCurrency(data.honorariosTotal)}</p>
              </div>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '9px' }}>IVA</p>
                <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>{formatCurrency(data.ivaTotal)}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, color: '#64748b', fontSize: '9px', textTransform: 'uppercase', fontWeight: 600 }}>Total a Pagar</p>
              <p style={{ margin: '2px 0 0', fontWeight: 800, fontSize: '22px', color: '#15803d' }}>{formatCurrency(data.granTotal)}</p>
            </div>
          </div>
        </div>

        {/* Instrucciones de pago */}
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px' }}>
          <h4 style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>Instrucciones de Pago</h4>
          <p style={{ margin: 0, fontSize: '10px', color: '#475569', lineHeight: 1.65 }}>
            El pago debe ser realizado en Efectivo en las oficinas de EMDECOB S.A.S o a la{' '}
            <strong style={{ color: '#1e293b' }}>Cuenta Corriente Empresarial No. 86700000493 del Banco BANCOLOMBIA</strong>,
            a nombre de Servicio Integral de Cobranza y Asesoría Jurídica.
            <br /><br />
            Una vez se realice, por favor enviar copia del soporte al correo:{' '}
            <strong style={{ color: '#15803d' }}>direccioncarteraphorizontal@emdecob.com</strong>{' '}
            o al WhatsApp <strong style={{ color: '#15803d' }}>3218520603</strong>.
          </p>
        </div>

        {/* Firma */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4px', paddingBottom: '8px' }}>
          <img
            src="/assets/firma.png"
            alt="Firma"
            style={{ height: '72px', objectFit: 'cover', objectPosition: 'center top', clipPath: 'inset(0px 0px 3px 0px)' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.insertAdjacentHTML('afterbegin', '<div style="height:48px;width:160px;border-bottom:1px solid #94a3b8;margin-bottom:6px"></div>');
            }}
          />
          <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '12px', color: '#1e293b' }}>Julián David Cuartas Reyes</p>
          <p style={{ margin: '1px 0 0', fontSize: '10px', color: '#64748b', fontWeight: 500 }}>Director de Cartera - Propiedad Horizontal</p>
        </div>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
