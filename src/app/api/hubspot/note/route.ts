import { NextResponse } from 'next/server';
import { addDealNote } from '@/lib/hubspot';

export async function POST(req: Request) {
  try {
    const { dealId, noteBody } = await req.json();

    if (!dealId || !noteBody) {
      return NextResponse.json(
        { success: false, error: 'dealId and noteBody are required' },
        { status: 400 }
      );
    }

    const result = await addDealNote(dealId, noteBody);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('API /api/hubspot/note error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create note in HubSpot' },
      { status: 500 }
    );
  }
}
