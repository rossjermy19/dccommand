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

export function setCachedGoldMap(map: Record<string, GoldDealRecord>) {
  cachedGoldMap = map;
}

/**
 * Synchronises Gold deal status with HubSpot CRM notes.
 * Delegates to the unified rate-limited status sync to avoid 429 limits.
 */
export async function syncGoldDealsFromHubSpot(force = false): Promise<Record<string, GoldDealRecord>> {
  const { syncAllCommandCentreNotesFromHubSpot } = await import('./status-sync');
  const result = await syncAllCommandCentreNotesFromHubSpot(force);
  return result.goldDeals;
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
