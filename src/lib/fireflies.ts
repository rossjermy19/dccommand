const FIREFLIES_GRAPHQL_URL = 'https://api.fireflies.ai/graphql';

export interface FirefliesTranscriptSummary {
  id: string;
  title: string;
  date: string;
  duration?: number;
  transcript_url?: string;
  summary?: {
    overview?: string;
    action_items?: string[];
  };
}

export async function fetchRecentTranscripts(limit: number = 20): Promise<FirefliesTranscriptSummary[]> {
  const apiKey = process.env.FIREFLIES_API_KEY;
  if (!apiKey) {
    return [];
  }

  const query = `
    query GetTranscripts($limit: Int) {
      transcripts(limit: $limit) {
        id
        title
        date
        duration
        transcript_url
        summary {
          overview
          action_items
        }
      }
    }
  `;

  try {
    const res = await fetch(FIREFLIES_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query, variables: { limit } }),
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error(`Fireflies API returned status ${res.status}`);
      return [];
    }

    const data = await res.json();
    return data.data?.transcripts || [];
  } catch (err) {
    console.error('Error fetching Fireflies transcripts:', err);
    return [];
  }
}

export async function fetchTranscriptDetails(transcriptId: string): Promise<{
  title: string;
  fullText: string;
  summary?: string;
} | null> {
  const apiKey = process.env.FIREFLIES_API_KEY;
  if (!apiKey) return null;

  const query = `
    query GetTranscript($id: String!) {
      transcript(id: $id) {
        id
        title
        date
        sentences {
          speaker_name
          text
        }
        summary {
          overview
          action_items
        }
      }
    }
  `;

  try {
    const res = await fetch(FIREFLIES_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query, variables: { id: transcriptId } }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const t = data.data?.transcript;
    if (!t) return null;

    const fullText = (t.sentences || [])
      .map((s: any) => `${s.speaker_name || 'Speaker'}: ${s.text}`)
      .join('\n');

    return {
      title: t.title,
      fullText,
      summary: t.summary?.overview,
    };
  } catch (err) {
    console.error('Error fetching transcript details:', err);
    return null;
  }
}
