import { NextResponse } from 'next/server';
import { fetchRecentTranscripts, fetchTranscriptDetails } from '@/lib/fireflies';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const transcriptId = searchParams.get('id');

    if (transcriptId) {
      const details = await fetchTranscriptDetails(transcriptId);
      if (!details) {
        return NextResponse.json({ success: false, error: 'Transcript not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, ...details });
    }

    const transcripts = await fetchRecentTranscripts(15);
    return NextResponse.json({
      success: true,
      hasApiKey: !!process.env.FIREFLIES_API_KEY,
      transcripts,
    });
  } catch (error: any) {
    console.error('API /api/fireflies/transcripts error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch Fireflies transcripts' },
      { status: 500 }
    );
  }
}
