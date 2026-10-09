import fs from 'fs';
import path from 'path';

export * from './tag-constants';

const TAGS_FILE = path.join(process.cwd(), 'data', 'deal-tags.json');

export function getCustomTagsMap(): Record<string, string[]> {
  try {
    if (fs.existsSync(TAGS_FILE)) {
      const data = fs.readFileSync(TAGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading deal tags file:', err);
  }
  return {};
}

export function saveCustomTag(dealId: string, tag: string): string[] {
  const map = getCustomTagsMap();
  const existing = map[dealId] || [];
  if (!existing.includes(tag)) {
    existing.push(tag);
  }
  map[dealId] = existing;
  try {
    fs.mkdirSync(path.dirname(TAGS_FILE), { recursive: true });
    fs.writeFileSync(TAGS_FILE, JSON.stringify(map, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving deal tag:', err);
  }
  return existing;
}

export function removeCustomTag(dealId: string, tag: string): string[] {
  const map = getCustomTagsMap();
  const existing = map[dealId] || [];
  const updated = existing.filter((t) => t !== tag);
  map[dealId] = updated;
  try {
    fs.mkdirSync(path.dirname(TAGS_FILE), { recursive: true });
    fs.writeFileSync(TAGS_FILE, JSON.stringify(map, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error removing deal tag:', err);
  }
  return updated;
}
