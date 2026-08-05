import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // Extracting credentials and email data
    const pdfBlob = formData.get('pdf') as Blob;
    const toEmail = formData.get('email') as string;
    const conjuntoName = formData.get('conjunto') as string;
    const portafolio = (formData.get('portafolio') as string) || "PROPIEDAD HORIZONTAL";
    
    const smtpUser = formData.get('smtpUser') as string;
    const smtpPass = formData.get('smtpPass') as string;

    if (!pdfBlob || !toEmail || !smtpUser || !smtpPass) {
        return NextResponse.json({ success: false, error: "Missing required parameters or credentials." }, { status: 400 });
    }

    const isPropiedadHorizontal = portafolio.trim().toUpperCase() === "PROPIEDAD HORIZONTAL";
    const officialEmail = isPropiedadHorizontal ? "direccioncarteraphorizontal@emdecob.com" : "serviciosjuridicos2@emdecob.com";

    // Convert Blob -> Buffer for native node handler
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const phSubject = `Cuenta de Cobro correspondiente al Recaudo del Mes anterior y Solicitud de Pago dentro del Plazo Contractual - ${conjuntoName}`;
    const phBodyText = `Señor
Administrador/a de Propiedad Horizontal

Por medio de la presente, SERVICIOS INTEGRALES DE COBRANZA Y ASESORÍAS JURÍDICAS, identificada con NIT 900.294.018, se permite remitir la cuenta de cobro correspondiente a los dineros recaudados durante el mes anterior, para su respectiva verificación y trámite de pago.

De conformidad con lo estipulado en el contrato suscrito entre las partes, le informamos que el valor relacionado en la presente cuenta de cobro deberá ser cancelado dentro de los quince (15) días calendario siguientes a la fecha de presentación de la misma, término contractualmente establecido para el pago oportuno de las obligaciones a cargo de la administración.

El pago deberá realizarse a través de la siguiente cuenta bancaria:
Banco: Bancolombia 
Tipo de cuenta: Corriente 
Número de cuenta: 86700000493 
Titular: Servicios Integrales de Cobranza y Asesorías Jurídicas 
NIT: 900.294.018 - 8

Una vez efectuado el pago, le solicitamos de manera atenta remitir el respectivo soporte de pago (comprobante de transferencia o consignación) al correo electrónico direccioncarteraphorizontal@emdecob.com , con el fin de que el recaudo pueda ser debidamente identificado y aplicado, evitando así que la obligación quede registrada como pendiente de pago.

Agradecemos su habitual colaboración y el cumplimiento del plazo establecido, con el propósito de mantener al día las obligaciones derivadas del contrato, el resultado positivo de la gestión de recaudo y evitar inconvenientes administrativos o mensajes molestos de cobro.

Quedamos atentos a cualquier inquietud o aclaración adicional que requiera.

Cordialmente,

Julian D. Cuartas.
Director de portafolio de Propiedad Horizontal.
Servicios Integrales de Cobranza y Asesorías Jurídicas 
NIT 900.294.018 - 8`;

    const phBodyHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 650px;">
        <p><strong>Señor</strong><br>Administrador/a de Propiedad Horizontal</p>
        
        <p>Por medio de la presente, <strong>SERVICIOS INTEGRALES DE COBRANZA Y ASESORÍAS JURÍDICAS</strong>, identificada con NIT 900.294.018, se permite remitir la cuenta de cobro correspondiente a los dineros recaudados durante el mes anterior, para su respectiva verificación y trámite de pago.</p>
        
        <p>De conformidad con lo estipulado en el contrato suscrito entre las partes, le informamos que el valor relacionado en la presente cuenta de cobro deberá ser cancelado dentro de los quince (15) días calendario siguientes a la fecha de presentación de la misma, término contractualmente establecido para el pago oportuno de las obligaciones a cargo de la administración.</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 0 0 8px 0; font-weight: bold; color: #065f46;">El pago deberá realizarse a través de la siguiente cuenta bancaria:</p>
          <p style="margin: 3px 0;"><strong>Banco:</strong> Bancolombia</p>
          <p style="margin: 3px 0;"><strong>Tipo de cuenta:</strong> Corriente</p>
          <p style="margin: 3px 0;"><strong>Número de cuenta:</strong> 86700000493</p>
          <p style="margin: 3px 0;"><strong>Titular:</strong> Servicios Integrales de Cobranza y Asesorías Jurídicas</p>
          <p style="margin: 3px 0;"><strong>NIT:</strong> 900.294.018 - 8</p>
        </div>
        
        <p>Una vez efectuado el pago, le solicitamos de manera atenta remitir el respectivo soporte de pago (comprobante de transferencia o consignación) al correo electrónico <a href="mailto:direccioncarteraphorizontal@emdecob.com" style="color: #059669; font-weight: bold;">direccioncarteraphorizontal@emdecob.com</a>, con el fin de que el recaudo pueda ser debidamente identificado y aplicado, evitando así que la obligación quede registrada como pendiente de pago.</p>
        
        <p>Agradecemos su habitual colaboración y el cumplimiento del plazo establecido, con el propósito de mantener al día las obligaciones derivadas del contrato, el resultado positivo de la gestión de recaudo y evitar inconvenientes administrativos o mensajes molestos de cobro.</p>
        
        <p>Quedamos atentos a cualquier inquietud o aclaración adicional que requiera.</p>
        
        <br>
        <p style="margin-bottom: 4px;">Cordialmente,</p>
        <p style="margin: 0; font-weight: bold; color: #1e293b;">Julian D. Cuartas.</p>
        <p style="margin: 0; font-size: 14px; color: #475569;">Director de portafolio de Propiedad Horizontal.</p>
        <p style="margin: 0; font-size: 14px; color: #475569;">Servicios Integrales de Cobranza y Asesorías Jurídicas</p>
        <p style="margin: 0; font-size: 13px; color: #64748b;">NIT 900.294.018 - 8</p>
      </div>
    `;

    const mailOptions = {
      from: `"EMDECOB S.A.S" <${smtpUser}>`,
      replyTo: officialEmail,
      bcc: officialEmail,
      to: toEmail,
      subject: isPropiedadHorizontal ? phSubject : `Cuenta de Cobro: ${conjuntoName} - EMDECOB S.A.S`,
      text: isPropiedadHorizontal
        ? phBodyText
        : `Buen día,\n\nAdjunto enviamos la cuenta de cobro correspondiente a la gestión de cobro de cartera para ${conjuntoName}.\n\nPara dudas o confirmaciones de pago, comuníquese a nuestros canales oficiales detallados en el PDF.\n\nCordialmente,\nEMDECOB S.A.S`,
      html: isPropiedadHorizontal ? phBodyHtml : undefined,
      attachments: [
        {
          filename: `Cuenta_Cobro_${conjuntoName}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    
    return NextResponse.json(
      { success: true, message: `Correo enviado a ${toEmail}`, messageId: info.messageId },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Email Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error configurando SMTP." },
      { status: 500 }
    );
  }
}
