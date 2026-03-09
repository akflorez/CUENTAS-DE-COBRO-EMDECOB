import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // Extracting credentials and email data
    const pdfBlob = formData.get('pdf') as Blob;
    const toEmail = formData.get('email') as string;
    const conjuntoName = formData.get('conjunto') as string;
    
    const smtpUser = formData.get('smtpUser') as string;
    const smtpPass = formData.get('smtpPass') as string;

    if (!pdfBlob || !toEmail || !smtpUser || !smtpPass) {
        return NextResponse.json({ success: false, error: "Missing required parameters or credentials." }, { status: 400 });
    }

    // Convert Blob -> Buffer for native node handler
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Default configuration for Gmail since it's most common for App Passwords. 
    // If corporate, we might need manual host/port later, but Gmail covers 90% of basic use cases.
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const mailOptions = {
      from: `"EMDECOB S.A.S" <${smtpUser}>`,
      to: toEmail,
      subject: `Cuenta de Cobro PH: ${conjuntoName} - EMDECOB S.A.S`,
      text: `Buen día,\n\nAdjunto enviamos la cuenta de cobro correspondiente a la gestión de cobro de cartera de propiedad horizontal para ${conjuntoName}.\n\nPara dudas o confirmaciones de pago, comuníquese a nuestros canales oficiales detallados en el PDF.\n\nCordialmente,\nEMDECOB S.A.S`,
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
