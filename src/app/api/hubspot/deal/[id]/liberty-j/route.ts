import { NextRequest, NextResponse } from 'next/server';
import { pushDealToLibertyJ, recallDealFromLibertyJ, kickLibertyJ } from '@/lib/liberty-j';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { action, dealName, notes } = await req.json();

    if (action === 'push') {
      const result = await pushDealToLibertyJ(params.id, dealName, notes);
      return NextResponse.json(result);
    }

    if (action === 'recall') {
      const result = await recallDealFromLibertyJ(params.id);
      return NextResponse.json(result);
    }

    if (action === 'kick') {
      const result = await kickLibertyJ(params.id, notes);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/hubspot/deal/[id]/liberty-j:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Operation failed' },
      { status: 500 }
    );
  }
}
