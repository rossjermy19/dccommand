import { NextRequest, NextResponse } from 'next/server';
import { saveAlignedRoom } from '@/lib/aligned-rooms';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { hasAlignedRoom, dealName } = await req.json();

    if (typeof hasAlignedRoom !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'hasAlignedRoom must be a boolean' },
        { status: 400 }
      );
    }

    const result = await saveAlignedRoom(params.id, hasAlignedRoom, dealName);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in /api/hubspot/deal/[id]/aligned-room:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Operation failed' },
      { status: 500 }
    );
  }
}
