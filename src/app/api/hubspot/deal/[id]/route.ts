import { NextResponse } from 'next/server';
import { getDealDetails } from '@/lib/hubspot';

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
