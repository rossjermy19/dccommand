import { NextResponse } from 'next/server';
import { createDealMeeting } from '@/lib/hubspot';

export async function POST(req: Request) {
  try {
    const { dealId, title, body, startTime, endTime, contactId } = await req.json();

    if (!dealId || !title || !startTime) {
      return NextResponse.json(
        { success: false, error: 'dealId, title, and startTime are required' },
        { status: 400 }
      );
    }

    const meeting = await createDealMeeting(dealId, {
      title,
      body,
      startTime,
      endTime,
      contactId,
    });

    return NextResponse.json({ success: true, meeting });
  } catch (error: any) {
    console.error('Error creating meeting in HubSpot:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create meeting' },
      { status: 500 }
    );
  }
}
