import fs from 'fs';
import path from 'path';
import { addDealNote } from './hubspot';
import { saveCustomTag, removeCustomTag } from './tags';

const LIBERTY_J_FILE = path.join(process.cwd(), 'data', 'liberty-j.json');
const HUBSPOT_BASE_URL = 'https://api.hubapi.com';
const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN || '';

export interface LibertyJDealRecord {
  isBackWithLibertyJ: boolean;
  date: string; // ISO date string when pushed back
  note?: string;
  lastChasedDate?: string;
  chaseCount?: number;
}

export function getLibertyJStatusMap(): Record<string, LibertyJDealRecord> {
  try {
    if (fs.existsSync(LIBERTY_J_FILE)) {
      const data = fs.readFileSync(LIBERTY_J_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading liberty-j status file:', err);
  }
  return {};
}

/**
 * Synchronizes Liberty J state directly from HubSpot CRM notes.
 * This ensures state persists forever even when server containers restart.
 */
export async function syncLibertyJStatusFromHubSpot(): Promise<Record<string, LibertyJDealRecord>> {
  const localMap = getLibertyJStatusMap();
  if (!TOKEN) return localMap;

  try {
    // 1. Search for Liberty J handoff notes in HubSpot CRM
    const res = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/notes/search`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{
            propertyName: 'hs_note_body',
            operator: 'CONTAINS_TOKEN',
            value: '*Handed Back to Liberty J*'
          }]
        }],
        properties: ['hs_note_body', 'hs_createdate'],
        limit: 100
      }),
      cache: 'no-store',
    });

    if (!res.ok) return localMap;
    const data = await res.json();
    const notes = data.results || [];
    if (notes.length === 0) return localMap;

    // 2. Batch fetch deal associations for these notes
    const assocRes = await fetch(`${HUBSPOT_BASE_URL}/crm/v4/associations/notes/deals/batch/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputs: notes.map((n: any) => ({ id: n.id }))
      }),
      cache: 'no-store',
    });

    if (!assocRes.ok) return localMap;
    const assocData = await assocRes.json();

    // 3. Check for any subsequent recall notes
    const recallRes = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/notes/search`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{
            propertyName: 'hs_note_body',
            operator: 'CONTAINS_TOKEN',
            value: '*Deal Recalled from Liberty J*'
          }]
        }],
        properties: ['hs_note_body', 'hs_createdate'],
        limit: 100
      }),
      cache: 'no-store',
    });

    const recallDealMap: Record<string, number> = {};
    if (recallRes.ok) {
      const recallData = await recallRes.json();
      const recallNotes = recallData.results || [];
      if (recallNotes.length > 0) {
        const rAssocRes = await fetch(`${HUBSPOT_BASE_URL}/crm/v4/associations/notes/deals/batch/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs: recallNotes.map((n: any) => ({ id: n.id })) }),
          cache: 'no-store',
        });
        if (rAssocRes.ok) {
          const rAssocData = await rAssocRes.json();
          (rAssocData.results || []).forEach((r: any) => {
            const note = recallNotes.find((n: any) => n.id === r.from.id);
            if (note) {
              const d = new Date(note.properties.hs_createdate).getTime();
              (r.to || []).forEach((t: any) => {
                const dealId = t.toObjectId.toString();
                if (!recallDealMap[dealId] || d > recallDealMap[dealId]) {
                  recallDealMap[dealId] = d;
                }
              });
            }
          });
        }
      }
    }

    // 4. Merge discovered Liberty J state
    const mergedMap = { ...localMap };
    (assocData.results || []).forEach((r: any) => {
      const note = notes.find((n: any) => n.id === r.from.id);
      const handoffDate = note?.properties?.hs_createdate || new Date().toISOString();
      const handoffTime = new Date(handoffDate).getTime();

      (r.to || []).forEach((t: any) => {
        const dealId = t.toObjectId.toString();
        const recallTime = recallDealMap[dealId];
        if (recallTime && recallTime > handoffTime) {
          if (mergedMap[dealId]) {
            mergedMap[dealId].isBackWithLibertyJ = false;
          }
          return;
        }

        mergedMap[dealId] = {
          isBackWithLibertyJ: true,
          date: handoffDate,
          note: mergedMap[dealId]?.note,
          lastChasedDate: mergedMap[dealId]?.lastChasedDate,
          chaseCount: mergedMap[dealId]?.chaseCount || 0,
        };

        saveCustomTag(dealId, 'Back with Liberty J');
      });
    });

    try {
      fs.mkdirSync(path.dirname(LIBERTY_J_FILE), { recursive: true });
      fs.writeFileSync(LIBERTY_J_FILE, JSON.stringify(mergedMap, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Failed to cache liberty-j.json:', err);
    }

    return mergedMap;
  } catch (err) {
    console.error('Error syncing Liberty J from HubSpot:', err);
    return localMap;
  }
}

export function saveLibertyJStatus(dealId: string, record: LibertyJDealRecord): void {
  const map = getLibertyJStatusMap();
  map[dealId] = record;
  try {
    fs.mkdirSync(path.dirname(LIBERTY_J_FILE), { recursive: true });
    fs.writeFileSync(LIBERTY_J_FILE, JSON.stringify(map, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving liberty-j status file:', err);
  }
}

/**
 * Pushes a deal back to Liberty J:
 * 1. Updates local state
 * 2. Adds "Back with Liberty J" tag to deal
 * 3. Logs official standard note to HubSpot CRM deal timeline
 */
export async function pushDealToLibertyJ(
  dealId: string,
  dealName?: string,
  customInstructions?: string
): Promise<{ success: boolean; date: string }> {
  const nowStr = new Date().toISOString();
  saveLibertyJStatus(dealId, {
    isBackWithLibertyJ: true,
    date: nowStr,
    note: customInstructions,
  });

  saveCustomTag(dealId, 'Back with Liberty J');

  // Create standard note in HubSpot CRM
  try {
    const formattedDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const noteHtml = `<h3>🔄 Handed Back to Liberty J</h3>
<p>This deal has been pushed back to <strong>Liberty J</strong> for them to chase up and re-engage the prospect.</p>
<p><strong>Action:</strong> Liberty J have got the action now to get it back in for Ross.</p>
${customInstructions ? `<p><strong>Instructions / Context:</strong> ${customInstructions}</p>` : ''}
<p style="color:#64748b; font-size:12px;"><em>Logged via DC Command Centre • ${formattedDate}</em></p>`;

    await addDealNote(dealId, noteHtml);
  } catch (e) {
    console.warn('Failed to log Liberty J note to HubSpot:', e);
  }

  return { success: true, date: nowStr };
}

/**
 * Recalls a deal back to Ross's active desk from Liberty J
 */
export async function recallDealFromLibertyJ(dealId: string): Promise<{ success: boolean }> {
  saveLibertyJStatus(dealId, {
    isBackWithLibertyJ: false,
    date: new Date().toISOString(),
  });

  removeCustomTag(dealId, 'Back with Liberty J');

  try {
    const formattedDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const noteHtml = `<h3>📥 Deal Recalled from Liberty J</h3>
<p>Ross has brought this deal back to his active desk for follow-up.</p>
<p style="color:#64748b; font-size:12px;"><em>Logged via DC Command Centre • ${formattedDate}</em></p>`;

    await addDealNote(dealId, noteHtml);
  } catch (e) {
    console.warn('Failed to log recall note to HubSpot:', e);
  }

  return { success: true };
}

/**
 * Logs a "Kick" / Follow-up chase with Liberty J
 */
export async function kickLibertyJ(dealId: string, notes?: string): Promise<{ success: boolean }> {
  const map = getLibertyJStatusMap();
  const existing = map[dealId] || { isBackWithLibertyJ: true, date: new Date().toISOString() };
  existing.lastChasedDate = new Date().toISOString();
  existing.chaseCount = (existing.chaseCount || 0) + 1;
  saveLibertyJStatus(dealId, existing);

  try {
    const formattedDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const noteHtml = `<h3>⚡ Liberty J Follow-up Chase Logged</h3>
<p>Ross gave Liberty J a kick to follow up on progress with this account.</p>
${notes ? `<p><strong>Chase Notes:</strong> ${notes}</p>` : ''}
<p style="color:#64748b; font-size:12px;"><em>Logged via DC Command Centre • ${formattedDate}</em></p>`;

    await addDealNote(dealId, noteHtml);
  } catch (e) {
    console.warn('Failed to log kick note to HubSpot:', e);
  }

  return { success: true };
}
