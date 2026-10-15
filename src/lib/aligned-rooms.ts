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

export function setCachedAlignedRoomsMap(map: Record<string, AlignedRoomRecord>) {
  cachedAlignedRoomsMap = map;
}

/**
 * Synchronises Aligned Room status with HubSpot CRM notes.
 * Delegates to the unified rate-limited status sync to avoid 429 limits.
 */
export async function syncAlignedRoomsFromHubSpot(force = false): Promise<Record<string, AlignedRoomRecord>> {
  const { syncAllCommandCentreNotesFromHubSpot } = await import('./status-sync');
  const result = await syncAllCommandCentreNotesFromHubSpot(force);
  return result.alignedRooms;
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
