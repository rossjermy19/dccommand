import { NextRequest, NextResponse } from 'next/server';
import { saveGoldDeal } from '@/lib/gold-deals';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isGold, dealName } = await req.json();

    if (typeof isGold !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isGold must be a boolean' },
        { status: 400 }
      );
    }

    const result = await saveGoldDeal(params.id, isGold, dealName);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in /api/hubspot/deal/[id]/gold:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Operation failed' },
      { status: 500 }
    );
  }
}
