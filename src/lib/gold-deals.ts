import fs from 'fs';
import path from 'path';
import { addDealNote } from './hubspot';
import { saveCustomTag, removeCustomTag } from './tags';

const GOLD_DEALS_FILE = path.join(process.cwd(), 'data', 'gold-deals.json');
const HUBSPOT_BASE_URL = 'https://api.hubapi.com';
const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN || '';

export interface GoldDealRecord {
  isGold: boolean;
  date: string; // ISO timestamp when marked gold
  dealName?: string;
}

export function getGoldDealsMap(): Record<string, GoldDealRecord> {
  try {
    if (fs.existsSync(GOLD_DEALS_FILE)) {
      const data = fs.readFileSync(GOLD_DEALS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading gold deals file:', err);
  }
  return {};
}

/**
 * Synchronizes Gold deal status with HubSpot CRM notes.
 * This ensures status survives Railway container restarts and redeployments permanently.
 */
export async function syncGoldDealsFromHubSpot(): Promise<Record<string, GoldDealRecord>> {
  const localMap = getGoldDealsMap();
  if (!TOKEN) return localMap;

  try {
    // 1. Search for Gold Deal notes in HubSpot CRM
    const res = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/notes/search`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{
            propertyName: 'hs_note_body',
            operator: 'CONTAINS_TOKEN',
            value: '*HIGH CHANCE (Gold Deal)*'
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

    // 3. Search for any removal notes
    const removeRes = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/notes/search`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{
            propertyName: 'hs_note_body',
            operator: 'CONTAINS_TOKEN',
            value: '*Gold Deal) status removed*'
          }]
        }],
        properties: ['hs_note_body', 'hs_createdate'],
        limit: 100
      }),
      cache: 'no-store',
    });

    const removalDealMap: Record<string, number> = {};
    if (removeRes.ok) {
      const removeData = await removeRes.json();
      const removeNotes = removeData.results || [];
      if (removeNotes.length > 0) {
        const rAssocRes = await fetch(`${HUBSPOT_BASE_URL}/crm/v4/associations/notes/deals/batch/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputs: removeNotes.map((n: any) => ({ id: n.id }))
          }),
          cache: 'no-store',
        });
        if (rAssocRes.ok) {
          const rAssocData = await rAssocRes.json();
          (rAssocData.results || []).forEach((r: any) => {
            const noteObj = removeNotes.find((n: any) => n.id === r.from.id);
            const removeTime = noteObj?.properties?.hs_createdate
              ? new Date(noteObj.properties.hs_createdate).getTime()
              : 0;
            (r.to || []).forEach((t: any) => {
              const dId = t.toObjectId.toString();
              if (!removalDealMap[dId] || removeTime > removalDealMap[dId]) {
                removalDealMap[dId] = removeTime;
              }
            });
          });
        }
      }
    }

    // 4. Construct merged map from HubSpot CRM
    const mergedMap = { ...localMap };
    (assocData.results || []).forEach((r: any) => {
      const noteObj = notes.find((n: any) => n.id === r.from.id);
      const markTime = noteObj?.properties?.hs_createdate
        ? new Date(noteObj.properties.hs_createdate).getTime()
        : 0;
      const markDateStr = noteObj?.properties?.hs_createdate || new Date().toISOString();

      (r.to || []).forEach((t: any) => {
        const dealId = t.toObjectId.toString();
        const removeTime = removalDealMap[dealId] || 0;

        if (removeTime > markTime) {
          if (mergedMap[dealId]) {
            mergedMap[dealId].isGold = false;
          }
        } else {
          mergedMap[dealId] = {
            isGold: true,
            date: markDateStr,
            dealName: mergedMap[dealId]?.dealName,
          };
        }
      });
    });

    // Write back to file for fast local reads
    try {
      fs.mkdirSync(path.dirname(GOLD_DEALS_FILE), { recursive: true });
      fs.writeFileSync(GOLD_DEALS_FILE, JSON.stringify(mergedMap, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error caching synced gold deals map:', err);
    }

    return mergedMap;
  } catch (err) {
    console.warn('Could not sync gold deals from HubSpot:', err);
    return localMap;
  }
}

/**
 * Toggle or save Gold deal status (High Chance of Closing).
 */
export async function saveGoldDeal(
  dealId: string,
  isGold: boolean,
  dealName?: string
): Promise<{ success: boolean; isGold: boolean }> {
  const map = getGoldDealsMap();
  const now = new Date().toISOString();

  map[dealId] = {
    isGold,
    date: now,
    dealName: dealName || map[dealId]?.dealName,
  };

  try {
    fs.mkdirSync(path.dirname(GOLD_DEALS_FILE), { recursive: true });
    fs.writeFileSync(GOLD_DEALS_FILE, JSON.stringify(map, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving gold deal to file:', err);
  }

  // Manage tags
  if (isGold) {
    saveCustomTag(dealId, 'High Chance');
  } else {
    removeCustomTag(dealId, 'High Chance');
  }

  // Log note to HubSpot for permanent record & cross-container synchronization
  try {
    if (isGold) {
      const noteText = `⭐ [DC Command Centre] Deal marked as HIGH CHANCE (Gold Deal) by Ross Jermy.\n\nAssessed as having a high probability of going ahead. Highlighted gold on the pipeline command board.\n\nTimestamp: ${new Date().toLocaleString('en-GB')}`;
      await addDealNote(dealId, noteText);
    } else {
      const noteText = `⭐ [DC Command Centre] HIGH CHANCE (Gold Deal) status removed by Ross Jermy.\n\nTimestamp: ${new Date().toLocaleString('en-GB')}`;
      await addDealNote(dealId, noteText);
    }
  } catch (err) {
    console.warn(`Could not log gold status note to HubSpot for deal ${dealId}:`, err);
  }

  return { success: true, isGold };
}
