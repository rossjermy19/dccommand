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

/**
 * Fetches the authenticated user profile from Fireflies
 */
export async function getFirefliesCurrentUser(): Promise<{ id?: string; email?: string; name?: string } | null> {
  const apiKey = process.env.FIREFLIES_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(FIREFLIES_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: `
          query GetCurrentUser {
            user {
              id
              email
              name
            }
          }
        `,
      }),
      cache: 'no-store',
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.user || null;
  } catch (err) {
    console.warn('Could not fetch Fireflies current user:', err);
    return null;
  }
}

/**
 * Fetches transcripts scoped strictly to Ross's meetings (never other team members)
 */
export async function fetchRecentTranscripts(limit: number = 20): Promise<FirefliesTranscriptSummary[]> {
  const apiKey = process.env.FIREFLIES_API_KEY;
  if (!apiKey) {
    return [];
  }

  // Check if explicit user ID or email is configured in environment
  let targetUserId = process.env.FIREFLIES_USER_ID;
  const targetUserEmail = process.env.FIREFLIES_USER_EMAIL;

  // If no user ID configured, dynamically lookup the authenticated user profile
  if (!targetUserId && !targetUserEmail) {
    const currentUser = await getFirefliesCurrentUser();
    if (currentUser?.id) {
      targetUserId = currentUser.id;
    }
  }

  // Strategy 1: If targetUserId is available, query with user_id
  // This filters for meetings where the user is an organizer OR participant
  if (targetUserId) {
    try {
      const queryWithUserId = `
        query GetTranscriptsByUserId($limit: Int, $userId: String) {
          transcripts(limit: $limit, user_id: $userId) {
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

      const res = await fetch(FIREFLIES_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ query: queryWithUserId, variables: { limit, userId: targetUserId } }),
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        const results = data.data?.transcripts;
        if (Array.isArray(results) && results.length > 0) {
          return results;
        }
      }
    } catch (e) {
      console.warn('Fireflies user_id query failed, falling back to mine: true filter', e);
    }
  }

  // Strategy 2: If targetUserEmail is configured, query with organizers
  if (targetUserEmail) {
    try {
      const queryWithOrganizers = `
        query GetTranscriptsByOrganizers($limit: Int, $organizers: [String]) {
          transcripts(limit: $limit, organizers: $organizers) {
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

      const res = await fetch(FIREFLIES_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ query: queryWithOrganizers, variables: { limit, organizers: [targetUserEmail] } }),
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        const results = data.data?.transcripts;
        if (Array.isArray(results) && results.length > 0) {
          return results;
        }
      }
    } catch (e) {
      console.warn('Fireflies organizers query failed, falling back to mine: true', e);
    }
  }

  // Strategy 3: Standard official "mine: true" filter
  // This natively instructs Fireflies to return only the API key owner's meetings
  try {
    const queryMine = `
      query GetMyTranscripts($limit: Int) {
        transcripts(limit: $limit, mine: true) {
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

    const res = await fetch(FIREFLIES_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query: queryMine, variables: { limit } }),
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      if (data.data?.transcripts) {
        return data.data.transcripts;
      }
    }
  } catch (err) {
    console.error('Error fetching Fireflies transcripts with mine: true:', err);
  }

  return [];
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
