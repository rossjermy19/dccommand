import { NextResponse } from 'next/server';
import { getDealDetails, updateDealStage, updateDealSource } from '@/lib/hubspot';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const dealId = params.id;
    if (!dealId) {
      return NextResponse.json({ success: false, error: 'Deal ID is required' }, { status: 400 });
    }

    const details = await getDealDetails(dealId);
    return NextResponse.json({ success: true, ...details });
  } catch (error: any) {
    console.error(`Error fetching deal ${params.id} details:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch deal details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const dealId = params.id;
    if (!dealId) {
      return NextResponse.json({ success: false, error: 'Deal ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const { stage, subSource } = body;

    if (stage) {
      await updateDealStage(dealId, stage);
    }

    if (subSource !== undefined) {
      await updateDealSource(dealId, subSource);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error updating deal ${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update deal' },
      { status: 500 }
    );
  }
}
