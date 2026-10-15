import fs from 'fs';
import path from 'path';
import { hubspotFetch, hubspotSearchFetch } from './hubspot-fetch';
import { getGoldDealsMap, setCachedGoldMap, GoldDealRecord } from './gold-deals';
import { getAlignedRoomsMap, setCachedAlignedRoomsMap, AlignedRoomRecord } from './aligned-rooms';
import { getLibertyJStatusMap, setCachedLibertyJMap, LibertyJDealRecord } from './liberty-j';
import { saveCustomTag } from './tags';

const HUBSPOT_BASE_URL = 'https://api.hubapi.com';
const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN || '';

const GOLD_DEALS_FILE = path.join(process.cwd(), 'data', 'gold-deals.json');
const ALIGNED_ROOMS_FILE = path.join(process.cwd(), 'data', 'aligned-rooms.json');
const LIBERTY_J_FILE = path.join(process.cwd(), 'data', 'liberty-j.json');

let lastUnifiedSyncTime = 0;
const UNIFIED_SYNC_TTL = 5 * 60 * 1000; // 5 minutes cache

/**
 * Unified status synchronisation across Gold Deals, Aligned Rooms, and Liberty J.
 * Executes ONE single search query to find all DC Command Centre notes rather than 6 separate queries,
 * eliminating 429 rate limit errors completely.
 */
export async function syncAllCommandCentreNotesFromHubSpot(force = false): Promise<{
  goldDeals: Record<string, GoldDealRecord>;
  alignedRooms: Record<string, AlignedRoomRecord>;
  libertyJ: Record<string, LibertyJDealRecord>;
}> {
  const currentGoldMap = { ...getGoldDealsMap() };
  const currentAlignedMap = { ...getAlignedRoomsMap() };
  const currentLibertyJMap = { ...getLibertyJStatusMap() };

  if (!TOKEN) {
    return {
      goldDeals: currentGoldMap,
      alignedRooms: currentAlignedMap,
      libertyJ: currentLibertyJMap,
    };
  }

  // Return from memory/disk if synced within TTL
  if (!force && Date.now() - lastUnifiedSyncTime < UNIFIED_SYNC_TTL) {
    return {
      goldDeals: currentGoldMap,
      alignedRooms: currentAlignedMap,
      libertyJ: currentLibertyJMap,
    };
  }

  try {
    // 1. Single consolidated search for all Command Centre and Liberty J notes
    const searchRes = await hubspotSearchFetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/notes/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'hs_note_body',
                operator: 'CONTAINS_TOKEN',
                value: '*DC Command Centre*',
              },
            ],
          },
          {
            filters: [
              {
                propertyName: 'hs_note_body',
                operator: 'CONTAINS_TOKEN',
                value: '*Liberty J*',
              },
            ],
          },
        ],
        properties: ['hs_note_body', 'hs_createdate'],
        sorts: [{ propertyName: 'hs_createdate', direction: 'DESCENDING' }],
        limit: 100,
      }),
      cache: 'no-store',
    });

    if (!searchRes.ok) {
      console.warn(`[Status Sync] Note search returned ${searchRes.status}`);
      return {
        goldDeals: currentGoldMap,
        alignedRooms: currentAlignedMap,
        libertyJ: currentLibertyJMap,
      };
    }

    const searchData = await searchRes.json();
    const notes: any[] = searchData.results || [];

    if (notes.length === 0) {
      lastUnifiedSyncTime = Date.now();
      return {
        goldDeals: currentGoldMap,
        alignedRooms: currentAlignedMap,
        libertyJ: currentLibertyJMap,
      };
    }

    // 2. Single batch association read to map all notes to deals
    const assocRes = await hubspotFetch(`${HUBSPOT_BASE_URL}/crm/v4/associations/notes/deals/batch/read`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: notes.map((n: any) => ({ id: n.id })),
      }),
      cache: 'no-store',
    });

    if (!assocRes.ok) {
      console.warn(`[Status Sync] Association batch read returned ${assocRes.status}`);
      return {
        goldDeals: currentGoldMap,
        alignedRooms: currentAlignedMap,
        libertyJ: currentLibertyJMap,
      };
    }

    const assocData = await assocRes.json();

    // 3. Track latest note timestamps per deal for each status
    const goldMarkTimes: Record<string, { time: number; dateStr: string }> = {};
    const goldRemoveTimes: Record<string, number> = {};

    const alignedMarkTimes: Record<string, { time: number; dateStr: string }> = {};
    const alignedRemoveTimes: Record<string, number> = {};

    const libertyJHandoffTimes: Record<string, { time: number; dateStr: string }> = {};
    const libertyJRecallTimes: Record<string, number> = {};

    (assocData.results || []).forEach((r: any) => {
      const note = notes.find((n: any) => n.id === r.from.id);
      if (!note) return;

      const body = note.properties?.hs_note_body || '';
      const dateStr = note.properties?.hs_createdate || new Date().toISOString();
      const time = new Date(dateStr).getTime();

      (r.to || []).forEach((t: any) => {
        const dealId = t.toObjectId.toString();

        // A. Gold Deal Status
        if (body.includes('HIGH CHANCE (Gold Deal)') || body.includes('Gold Deal')) {
          if (body.includes('status removed')) {
            if (!goldRemoveTimes[dealId] || time > goldRemoveTimes[dealId]) {
              goldRemoveTimes[dealId] = time;
            }
          } else {
            if (!goldMarkTimes[dealId] || time > goldMarkTimes[dealId].time) {
              goldMarkTimes[dealId] = { time, dateStr };
            }
          }
        }

        // B. Aligned Room Status
        if (body.includes('ALIGNED ROOM') || body.includes('Aligned Room')) {
          if (body.includes('status removed')) {
            if (!alignedRemoveTimes[dealId] || time > alignedRemoveTimes[dealId]) {
              alignedRemoveTimes[dealId] = time;
            }
          } else {
            if (!alignedMarkTimes[dealId] || time > alignedMarkTimes[dealId].time) {
              alignedMarkTimes[dealId] = { time, dateStr };
            }
          }
        }

        // C. Liberty J Status
        if (body.includes('Handed Back to Liberty J')) {
          if (!libertyJHandoffTimes[dealId] || time > libertyJHandoffTimes[dealId].time) {
            libertyJHandoffTimes[dealId] = { time, dateStr };
          }
        } else if (body.includes('Deal Recalled from Liberty J')) {
          if (!libertyJRecallTimes[dealId] || time > libertyJRecallTimes[dealId]) {
            libertyJRecallTimes[dealId] = time;
          }
        }
      });
    });

    // 4. Merge Gold Deals
    Object.keys(goldMarkTimes).forEach((dealId) => {
      const mark = goldMarkTimes[dealId];
      const removeTime = goldRemoveTimes[dealId] || 0;
      if (removeTime > mark.time) {
        if (currentGoldMap[dealId]) currentGoldMap[dealId].isGold = false;
      } else {
        currentGoldMap[dealId] = {
          isGold: true,
          date: mark.dateStr,
          dealName: currentGoldMap[dealId]?.dealName,
        };
        saveCustomTag(dealId, 'High Chance');
      }
    });

    // Merge Aligned Rooms
    Object.keys(alignedMarkTimes).forEach((dealId) => {
      const mark = alignedMarkTimes[dealId];
      const removeTime = alignedRemoveTimes[dealId] || 0;
      if (removeTime > mark.time) {
        if (currentAlignedMap[dealId]) currentAlignedMap[dealId].hasAlignedRoom = false;
      } else {
        currentAlignedMap[dealId] = {
          hasAlignedRoom: true,
          date: mark.dateStr,
          dealName: currentAlignedMap[dealId]?.dealName,
        };
        saveCustomTag(dealId, 'Aligned Room');
      }
    });

    // Merge Liberty J
    Object.keys(libertyJHandoffTimes).forEach((dealId) => {
      const handoff = libertyJHandoffTimes[dealId];
      const recallTime = libertyJRecallTimes[dealId] || 0;
      if (recallTime > handoff.time) {
        if (currentLibertyJMap[dealId]) currentLibertyJMap[dealId].isBackWithLibertyJ = false;
      } else {
        currentLibertyJMap[dealId] = {
          isBackWithLibertyJ: true,
          date: handoff.dateStr,
          note: currentLibertyJMap[dealId]?.note,
          lastChasedDate: currentLibertyJMap[dealId]?.lastChasedDate,
          chaseCount: currentLibertyJMap[dealId]?.chaseCount || 0,
        };
        saveCustomTag(dealId, 'Back with Liberty J');
      }
    });

    // Write all updated maps to disk and memory caches
    try {
      fs.mkdirSync(path.dirname(GOLD_DEALS_FILE), { recursive: true });
      fs.writeFileSync(GOLD_DEALS_FILE, JSON.stringify(currentGoldMap, null, 2), 'utf-8');
      fs.writeFileSync(ALIGNED_ROOMS_FILE, JSON.stringify(currentAlignedMap, null, 2), 'utf-8');
      fs.writeFileSync(LIBERTY_J_FILE, JSON.stringify(currentLibertyJMap, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving synced status maps to disk:', err);
    }

    setCachedGoldMap(currentGoldMap);
    setCachedAlignedRoomsMap(currentAlignedMap);
    setCachedLibertyJMap(currentLibertyJMap);

    lastUnifiedSyncTime = Date.now();
  } catch (err) {
    console.warn('[Status Sync] Unified note synchronisation failed:', err);
  }

  return {
    goldDeals: currentGoldMap,
    alignedRooms: currentAlignedMap,
    libertyJ: currentLibertyJMap,
  };
}
