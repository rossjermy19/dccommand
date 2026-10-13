import { NextRequest, NextResponse } from 'next/server';
import { generateAlignedStory, saveAlignedStory, getAlignedStoriesMap } from '@/lib/aligned';
import { fetchTranscriptDetails } from '@/lib/fireflies';

export async function POST(req: NextRequest) {
  try {
    const { dealId, dealName, clientName, transcriptText, firefliesTranscriptId } = await req.json();

    let textToUse = (transcriptText || '').trim();

    // If client did not send transcriptText directly, attempt to fetch from Fireflies via ID
    if (!textToUse && firefliesTranscriptId) {
      try {
        const details = await fetchTranscriptDetails(firefliesTranscriptId);
        if (details?.fullText) {
          textToUse = details.fullText;
        } else if (details?.summary) {
          textToUse = details.summary;
        }
      } catch (err) {
        console.warn('Server-side Fireflies transcript lookup failed, using deal context:', err);
      }
    }

    if (!textToUse) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No transcript text was found. Please select a valid Fireflies recording or paste your call notes/transcript into the Paste tab.' 
        }, 
        { status: 400 }
      );
    }

    const story = await generateAlignedStory(textToUse, dealName, clientName);

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
