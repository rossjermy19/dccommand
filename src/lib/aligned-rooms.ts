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

export function getAlignedRoomsMap(): Record<string, AlignedRoomRecord> {
  try {
    if (fs.existsSync(ALIGNED_ROOMS_FILE)) {
      const data = fs.readFileSync(ALIGNED_ROOMS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading aligned rooms file:', err);
  }
  return {};
}

/**
 * Synchronises Aligned Room status with HubSpot CRM notes.
 * This ensures status survives Railway container restarts and redeployments permanently.
 */
export async function syncAlignedRoomsFromHubSpot(): Promise<Record<string, AlignedRoomRecord>> {
  const localMap = getAlignedRoomsMap();
  if (!TOKEN) return localMap;

  try {
    // 1. Search for Aligned Room notes in HubSpot CRM
    const res = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/notes/search`, {
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
            value: '*Aligned Room status removed*'
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

    // Write back to file for fast local reads
    try {
      fs.mkdirSync(path.dirname(ALIGNED_ROOMS_FILE), { recursive: true });
      fs.writeFileSync(ALIGNED_ROOMS_FILE, JSON.stringify(mergedMap, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error caching synced aligned rooms map:', err);
    }

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
