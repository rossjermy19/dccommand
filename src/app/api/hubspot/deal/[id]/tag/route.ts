import { NextRequest, NextResponse } from 'next/server';
import { updateDealSource } from '@/lib/hubspot';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tag } = await req.json();
    if (!tag) {
      return NextResponse.json({ success: false, error: 'Tag is required' }, { status: 400 });
    }

    const success = await updateDealSource(params.id, tag);
    return NextResponse.json({ success, tag });
  } catch (error: any) {
    console.error('Error updating deal tag:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update tag' },
      { status: 500 }
    );
  }
}
