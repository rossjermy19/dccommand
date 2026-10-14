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

let cachedGoldMap: Record<string, GoldDealRecord> | null = null;
let lastGoldSyncTime = 0;
const GOLD_SYNC_CACHE_TTL = 60_000; // 60 seconds

export function getGoldDealsMap(): Record<string, GoldDealRecord> {
  if (cachedGoldMap) return cachedGoldMap;
  try {
    if (fs.existsSync(GOLD_DEALS_FILE)) {
      const data = fs.readFileSync(GOLD_DEALS_FILE, 'utf-8');
      cachedGoldMap = JSON.parse(data);
      return cachedGoldMap || {};
    }
  } catch (err) {
    console.error('Error reading gold deals file:', err);
  }
  return {};
}

/**
 * Synchronises Gold deal status with HubSpot CRM notes.
 * Executes search and association queries concurrently and caches in memory.
 */
export async function syncGoldDealsFromHubSpot(force = false): Promise<Record<string, GoldDealRecord>> {
  if (!force && cachedGoldMap && Date.now() - lastGoldSyncTime < GOLD_SYNC_CACHE_TTL) {
    return cachedGoldMap;
  }

  const localMap = getGoldDealsMap();
  if (!TOKEN) return localMap;

  try {
    // 1. Search concurrently for both Gold Deal notes and Removal notes
    const [res, removeRes] = await Promise.all([
      fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/notes/search`, {
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
      }),
      fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/notes/search`, {
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
      }),
    ]);

    const notesData = res.ok ? await res.json() : { results: [] };
    const removeData = removeRes.ok ? await removeRes.json() : { results: [] };

    const notes: any[] = notesData.results || [];
    const removeNotes: any[] = removeData.results || [];

    if (notes.length === 0 && removeNotes.length === 0) {
      cachedGoldMap = localMap;
      lastGoldSyncTime = Date.now();
      return localMap;
    }

    // 2. Concurrently batch fetch deal associations for both note sets
    const [assocRes, rAssocRes] = await Promise.all([
      notes.length > 0
        ? fetch(`${HUBSPOT_BASE_URL}/crm/v4/associations/notes/deals/batch/read`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              inputs: notes.map((n: any) => ({ id: n.id }))
            }),
            cache: 'no-store',
          })
        : null,
      removeNotes.length > 0
        ? fetch(`${HUBSPOT_BASE_URL}/crm/v4/associations/notes/deals/batch/read`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              inputs: removeNotes.map((n: any) => ({ id: n.id }))
            }),
            cache: 'no-store',
          })
        : null,
    ]);

    const assocData = assocRes && assocRes.ok ? await assocRes.json() : { results: [] };
    const rAssocData = rAssocRes && rAssocRes.ok ? await rAssocRes.json() : { results: [] };

    const removalDealMap: Record<string, number> = {};
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

    // 3. Construct merged map from HubSpot CRM
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

    // Write back to file and update memory cache
    try {
      fs.mkdirSync(path.dirname(GOLD_DEALS_FILE), { recursive: true });
      fs.writeFileSync(GOLD_DEALS_FILE, JSON.stringify(mergedMap, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error caching synced gold deals map:', err);
    }

    cachedGoldMap = mergedMap;
    lastGoldSyncTime = Date.now();

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

  cachedGoldMap = map;
  lastGoldSyncTime = Date.now();

  // Manage tags
  if (isGold) {
    saveCustomTag(dealId, 'High Chance');
  } else {
    removeCustomTag(dealId, 'High Chance');
  }

  // Log note to HubSpot for permanent record & cross-container synchronisation
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
