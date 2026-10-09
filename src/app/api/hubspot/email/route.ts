import { NextResponse } from 'next/server';
import { logDealEmail } from '@/lib/hubspot';

export async function POST(req: Request) {
  try {
    const { dealId, subject, body, contactId } = await req.json();

    if (!dealId || !subject || !body) {
      return NextResponse.json(
        { success: false, error: 'dealId, subject, and body are required' },
        { status: 400 }
      );
    }

    const email = await logDealEmail(dealId, {
      subject,
      body,
      contactId,
    });

    return NextResponse.json({ success: true, email });
  } catch (error: any) {
    console.error('Error logging email in HubSpot:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to log email' },
      { status: 500 }
    );
  }
}
