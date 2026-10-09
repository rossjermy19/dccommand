import { NextResponse } from 'next/server';
import { getOpenDeals } from '@/lib/hubspot';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const deals = await getOpenDeals();

    const totalPipelineValue = deals.reduce((acc, deal) => acc + (deal.amount || 0), 0);
    const urgentCount = deals.filter((d) => d.health === 'urgent').length;
    const warningCount = deals.filter((d) => d.health === 'warning').length;
    const healthyCount = deals.filter((d) => d.health === 'healthy').length;

    return NextResponse.json({
      success: true,
      stats: {
        totalDeals: deals.length,
        totalPipelineValue,
        urgentCount,
        warningCount,
        healthyCount,
      },
      deals,
    });
  } catch (error: any) {
    console.error('API /api/hubspot/deals error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch deals from HubSpot',
      },
      { status: 500 }
    );
  }
}
