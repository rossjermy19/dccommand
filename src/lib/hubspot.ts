import { Deal, PipelineStage } from './types';

const HUBSPOT_BASE_URL = 'https://api.hubapi.com';
const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN || '';
const OWNER_ID = process.env.HUBSPOT_OWNER_ID || '75550922';

const STAGE_LABELS: Record<string, string> = {
  // Default sales pipeline
  '1209215206': 'Meeting Booked',
  'presentationscheduled': 'Meeting Held',
  '1465977055': 'Upside',
  '1965601015': 'Expected to close',
  'decisionmakerboughtin': 'Committed',
  'contractsent': 'Contract Sent',
  'closedwon': 'Closed Won',
  'closedlost': 'Closed Lost',
  '1352329432': 'No Response - After Meeting',
  '2594016461': 'Re-Engage Pipeline Helm',
  '3043628233': 'Re-Engage Pipeline Voila',
  '3043628234': 'Re-Engage Pipeline Neuro',
  'qualifiedtobuy': 'Qualified To Buy',
  // Back Burning / Other
  '5536133318': 'Back Burner',
  '5030008022': 'Evaluation / Follow-up',
  '1638150379': 'Proposal / Active Review',
};

export async function fetchPipelineStages(): Promise<Record<string, string>> {
  if (!TOKEN) return STAGE_LABELS;
  try {
    const res = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/pipelines/deals`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return STAGE_LABELS;
    const data = await res.json();
    const map: Record<string, string> = { ...STAGE_LABELS };
    data.results?.forEach((pipe: any) => {
      pipe.stages?.forEach((stage: any) => {
        map[stage.id] = stage.label;
      });
    });
    return map;
  } catch (err) {
    console.error('Error fetching pipeline stages:', err);
    return STAGE_LABELS;
  }
}

export async function getOpenDeals(): Promise<Deal[]> {
  if (!TOKEN) throw new Error('HUBSPOT_ACCESS_TOKEN is not configured.');

  const stageLabels = await fetchPipelineStages();

  const body = {
    filters: [
      {
        propertyName: 'hubspot_owner_id',
        operator: 'EQ',
        value: OWNER_ID,
      },
      {
        propertyName: 'dealstage',
        operator: 'NEQ',
        value: 'closedlost',
      },
      {
        propertyName: 'dealstage',
        operator: 'NEQ',
        value: 'closedwon',
      },
    ],
    properties: [
      'dealname',
      'amount',
      'dealstage',
      'pipeline',
      'closedate',
      'hs_lastmodifieddate',
      'notes_last_contacted',
      'hubspot_owner_id',
    ],
    limit: 100,
    sorts: [
      {
        propertyName: 'hs_lastmodifieddate',
        direction: 'DESCENDING',
      },
    ],
  };

  const response = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/deals/search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HubSpot API failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const now = new Date().getTime();

  return (data.results || []).map((item: any): Deal => {
    const props = item.properties || {};
    const lastContactStr = props.notes_last_contacted || props.hs_lastmodifieddate;
    let daysSinceContact: number | null = null;
    
    if (lastContactStr) {
      const contactTime = new Date(lastContactStr).getTime();
      daysSinceContact = Math.max(0, Math.floor((now - contactTime) / (1000 * 60 * 60 * 24)));
    }

    // Health logic
    let health: 'urgent' | 'warning' | 'healthy' | 'neutral' = 'healthy';
    let healthReason = 'In active rhythm';

    if (daysSinceContact !== null && daysSinceContact >= 7) {
      health = 'urgent';
      healthReason = `Ghosting risk: No contact recorded in ${daysSinceContact} days`;
    } else if (daysSinceContact !== null && daysSinceContact >= 4) {
      health = 'warning';
      healthReason = `Follow-up recommended: ${daysSinceContact} days since last touch`;
    } else if (props.dealstage === 'presentationscheduled' || props.dealstage === '1209215206') {
      health = 'warning';
      healthReason = 'Post-meeting next step / follow-up action due';
    }

    const stageId = props.dealstage || '';
    const stageLabel = stageLabels[stageId] || STAGE_LABELS[stageId] || stageId;

    return {
      id: item.id,
      name: props.dealname || 'Untitled Deal',
      amount: props.amount ? parseFloat(props.amount) : null,
      stage: stageId,
      stageLabel,
      pipeline: props.pipeline || 'default',
      closeDate: props.closedate || null,
      lastModifiedDate: props.hs_lastmodifieddate || item.updatedAt,
      lastContactedDate: props.notes_last_contacted || null,
      daysSinceContact,
      health,
      healthReason,
      ownerId: props.hubspot_owner_id,
      hubspotUrl: `https://app-eu1.hubspot.com/contacts/145683546/record/0-3/${item.id}`,
    };
  });
}

export async function addDealNote(dealId: string, noteBody: string): Promise<any> {
  if (!TOKEN) throw new Error('HUBSPOT_ACCESS_TOKEN is not configured.');

  // Create Note
  const notePayload = {
    properties: {
      hs_timestamp: new Date().toISOString(),
      hs_note_body: noteBody,
    },
    associations: [
      {
        to: { id: dealId },
        types: [
          {
            associationCategory: 'HUBSPOT_DEFINED',
            associationTypeId: 214, // Note to Deal association
          },
        ],
      },
    ],
  };

  const response = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/notes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(notePayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create note: ${errorText}`);
  }

  return response.json();
}
