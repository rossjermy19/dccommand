import { NextResponse } from 'next/server';
import { analyzeTranscript } from '@/lib/ai-analyzer';

export async function POST(req: Request) {
  try {
    const { transcript, dealName, dealStage } = await req.json();

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Transcript content is required' },
        { status: 400 }
      );
    }

    const analysis = await analyzeTranscript(transcript, dealName, dealStage);
    return NextResponse.json({ success: true, analysis });
  } catch (error: any) {
    console.error('API /api/analyze error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
