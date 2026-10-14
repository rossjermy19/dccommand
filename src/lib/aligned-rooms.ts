import fs from 'fs';
import path from 'path';
import { addDealNote } from './hubspot';
import { saveCustomTag, removeCustomTag } from './tags';

const ALIGNED_ROOMS_FILE = path.join(process.cwd(), 'data', 'aligned-rooms.json');
const HUBSPOT_BASE_URL = 'https://api.hubapi.com';
const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN || '';

export interface AlignedRoomRecord {
  hasAlignedRoom: boolean;
  date: string; // ISO timestamp when marked
  dealName?: string;
}

let cachedAlignedRoomsMap: Record<string, AlignedRoomRecord> | null = null;
let lastAlignedRoomsSyncTime = 0;
const ALIGNED_ROOMS_SYNC_CACHE_TTL = 60_000; // 60 seconds

export function getAlignedRoomsMap(): Record<string, AlignedRoomRecord> {
  if (cachedAlignedRoomsMap) return cachedAlignedRoomsMap;
  try {
    if (fs.existsSync(ALIGNED_ROOMS_FILE)) {
      const data = fs.readFileSync(ALIGNED_ROOMS_FILE, 'utf-8');
      cachedAlignedRoomsMap = JSON.parse(data);
      return cachedAlignedRoomsMap || {};
    }
  } catch (err) {
    console.error('Error reading aligned rooms file:', err);
  }
  return {};
}

/**
 * Synchronises Aligned Room status with HubSpot CRM notes.
 * Executes search and association queries concurrently and caches in memory.
 */
export async function syncAlignedRoomsFromHubSpot(force = false): Promise<Record<string, AlignedRoomRecord>> {
  if (!force && cachedAlignedRoomsMap && Date.now() - lastAlignedRoomsSyncTime < ALIGNED_ROOMS_SYNC_CACHE_TTL) {
    return cachedAlignedRoomsMap;
  }

  const localMap = getAlignedRoomsMap();
  if (!TOKEN) return localMap;

  try {
    // 1. Search concurrently for both Aligned Room notes and Removal notes
    const [res, removeRes] = await Promise.all([
      fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/notes/search`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filterGroups: [{
            filters: [{
              propertyName: 'hs_note_body',
              operator: 'CONTAINS_TOKEN',
              value: '*ALIGNED ROOM*'
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
              value: '*Aligned Room status removed*'
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
      cachedAlignedRoomsMap = localMap;
      lastAlignedRoomsSyncTime = Date.now();
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
            mergedMap[dealId].hasAlignedRoom = false;
          }
        } else {
          mergedMap[dealId] = {
            hasAlignedRoom: true,
            date: markDateStr,
            dealName: mergedMap[dealId]?.dealName,
          };
        }
      });
    });

    // Write back to file and update memory cache
    try {
      fs.mkdirSync(path.dirname(ALIGNED_ROOMS_FILE), { recursive: true });
      fs.writeFileSync(ALIGNED_ROOMS_FILE, JSON.stringify(mergedMap, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error caching synced aligned rooms map:', err);
    }

    cachedAlignedRoomsMap = mergedMap;
    lastAlignedRoomsSyncTime = Date.now();

    return mergedMap;
  } catch (err) {
    console.warn('Could not sync aligned rooms from HubSpot:', err);
    return localMap;
  }
}

/**
 * Toggle or save Aligned Room status.
 */
export async function saveAlignedRoom(
  dealId: string,
  hasAlignedRoom: boolean,
  dealName?: string
): Promise<{ success: boolean; hasAlignedRoom: boolean }> {
  const map = getAlignedRoomsMap();
  const now = new Date().toISOString();

  map[dealId] = {
    hasAlignedRoom,
    date: now,
    dealName: dealName || map[dealId]?.dealName,
  };

  try {
    fs.mkdirSync(path.dirname(ALIGNED_ROOMS_FILE), { recursive: true });
    fs.writeFileSync(ALIGNED_ROOMS_FILE, JSON.stringify(map, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving aligned room to file:', err);
  }

  cachedAlignedRoomsMap = map;
  lastAlignedRoomsSyncTime = Date.now();

  // Manage custom tag
  if (hasAlignedRoom) {
    saveCustomTag(dealId, 'Aligned Room');
  } else {
    removeCustomTag(dealId, 'Aligned Room');
  }

  // Log note to HubSpot for permanent record & cross-container synchronisation
  try {
    if (hasAlignedRoom) {
      const noteText = `🎯 [DC Command Centre] Deal marked as having an ALIGNED ROOM set up by Ross Jermy.\n\nDigital Sales Room created on TeamAligned (https://thedespatchcompany.teamaligned.com/).\n\nTimestamp: ${new Date().toLocaleString('en-GB')}`;
      await addDealNote(dealId, noteText);
    } else {
      const noteText = `🎯 [DC Command Centre] Aligned Room status removed by Ross Jermy.\n\nTimestamp: ${new Date().toLocaleString('en-GB')}`;
      await addDealNote(dealId, noteText);
    }
  } catch (err) {
    console.warn(`Could not log aligned room status note to HubSpot for deal ${dealId}:`, err);
  }

  return { success: true, hasAlignedRoom };
}
