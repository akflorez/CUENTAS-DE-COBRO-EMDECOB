import { NextResponse } from 'next/server';
import { getInvoiceStats } from '../../actions/invoice';

export async function GET() {
  try {
    const res = await getInvoiceStats();
    return NextResponse.json({ success: true, data: res });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
}
