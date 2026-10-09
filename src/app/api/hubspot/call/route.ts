import { NextResponse } from 'next/server';
import { createDealCall } from '@/lib/hubspot';

export async function POST(req: Request) {
  try {
    const { dealId, title, body, outcome, contactId, duration } = await req.json();

    if (!dealId || !title) {
      return NextResponse.json(
        { success: false, error: 'dealId and title are required' },
        { status: 400 }
      );
    }

    const call = await createDealCall(dealId, {
      title,
      body,
      outcome,
      contactId,
      duration,
    });

    return NextResponse.json({ success: true, call });
  } catch (error: any) {
    console.error('Error logging call in HubSpot:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to log call' },
      { status: 500 }
    );
  }
}
