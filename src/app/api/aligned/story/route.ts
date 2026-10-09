import { NextRequest, NextResponse } from 'next/server';
import { generateAlignedStory, saveAlignedStory, getAlignedStoriesMap } from '@/lib/aligned';

export async function POST(req: NextRequest) {
  try {
    const { dealId, dealName, clientName, transcriptText, firefliesTranscriptId } = await req.json();

    if (!transcriptText || transcriptText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Call transcript is required to generate the Aligned story.' },
        { status: 400 }
      );
    }

    const story = await generateAlignedStory(transcriptText, dealName, clientName);

    if (dealId) {
      saveAlignedStory(dealId, story, firefliesTranscriptId);
    }

    return NextResponse.json({ success: true, story });
  } catch (error: any) {
    console.error('Error generating Aligned room story:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate story' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const map = getAlignedStoriesMap();
    return NextResponse.json({ success: true, stories: map });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
