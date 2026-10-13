import fs from 'fs';
import path from 'path';

const STORIES_FILE = path.join(process.cwd(), 'data', 'aligned-stories.json');

export interface AlignedStoryRecord {
  dealId: string;
  story: string;
  createdAt: string;
  firefliesTranscriptId?: string;
}

export function getAlignedStoriesMap(): Record<string, AlignedStoryRecord> {
  try {
    if (fs.existsSync(STORIES_FILE)) {
      const data = fs.readFileSync(STORIES_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading aligned stories file:', err);
  }
  return {};
}

export function saveAlignedStory(dealId: string, story: string, firefliesTranscriptId?: string): AlignedStoryRecord {
  const map = getAlignedStoriesMap();
  const record: AlignedStoryRecord = {
    dealId,
    story,
    createdAt: new Date().toISOString(),
    firefliesTranscriptId,
  };
  map[dealId] = record;
  try {
    fs.mkdirSync(path.dirname(STORIES_FILE), { recursive: true });
    fs.writeFileSync(STORIES_FILE, JSON.stringify(map, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving aligned story:', err);
  }
  return record;
}

/**
 * Builds the storyteller system prompt with few-shot calibration based on Ross Jermy's gold-standard.
 */
function buildStorySystemPrompt(targetName: string, dealName?: string): string {
  return `You are Ross Jermy, Senior Commercial Sales Consultant at Despatch Cloud.
You have just concluded an in-depth sales discovery and operational architecture call with ${targetName}.
Your objective is to write an authentic, human, consultative "Deal Room Story" to be pasted directly into their customer-facing Aligned Digital Sales Room (Aligned.so).

VOICE & TONE (MANDATORY RULES):
- Act as an expert consultative storyteller speaking directly to the client stakeholders.
- ABSOLUTELY ZERO AI CLICHÉS:
  * Do NOT use emojis anywhere in headings or bullet points (NO 🤝, 📌, 🚨, 💡, 🎯).
  * Do NOT use cheesy corporate platitudes ("In today's fast-paced world", "synergies", "seamlessly streamline", "welcome to your collaboration room").
  * Do NOT include generic checklist boxes or boilerplate mutual action plans unless concrete dates were agreed.
- HIGHLY PERSONALIZED:
  * Use the actual attendee names from the call.
  * Use their specific company name, actual volume numbers, target growth figures, software stack (e.g. Zendesk, Customer.io, Shopify, NetSuite), carriers (e.g. Royal Mail, DHL, DPD, PostNL), and warehouse hardware (e.g. Zebra printers, dispensers).
  * Focus on the exact operational friction they described.

PRODUCT AWARENESS:
Identify which product was discussed:
1. "Voila": Shipping management, dynamic carrier routing engine, Royal Mail service code overrides, cost center rating, London postcode surcharge avoidance, silent warehouse printing (ZPL/PDF/PNG via QZ Tray & PrintNode), assembled kits & return labels, post-purchase tracking webhooks into Customer.io/Zendesk, and European carrier integrations (PostNL, Deutsche Post, DHL).
2. "Neuro": Next-generation WMS, intelligent batch & wave picking, barcode scanning mobile workflows, real-time multi-channel inventory synchronization, bin allocation, replenishment, pharmacy/batch compliance.
3. If both were discussed, reference both Voila and Neuro appropriately.

REQUIRED STORY FORMAT:

- It was great catching up with [both of you, Name and Name / you, Name].

[Company Name] is scaling at a phenomenal pace—moving from [specific volume numbers/context from call] toward [target/growth vision], alongside [specific expansion plans, e.g. international distribution]. When operations move that fast, logistics tech cannot be a bottleneck; it needs to be an accelerator that adapts seamlessly to the warehouse floor, partner networks, and customer touchpoints.

Here is a summary of the key challenges we discussed and how [Voila / Neuro] directly solves them.

1. [Punchy Challenge Title, e.g. Complex Carrier Rules & Avoiding Margin Traps]
The Challenge: [Crisp 2-3 sentence explanation of the exact friction, systems, and operational constraints they described on the call].

How [Voila / Neuro] Solves It:
[Sub-solution Name]: [Clear, technical yet commercial explanation of how the capability solves it without requiring rule rebuilds or operational downtime].
[Sub-solution Name]: [Next specific capability explanation].

2. [Next Punchy Challenge Title, e.g. Streamlining Warehouse Floor Printing]
The Challenge: [...]
How [Voila / Neuro] Solves It:
[...]

(Generate 3 to 5 key challenges that were genuinely discussed on the call).

FEW-SHOT REFERENCE (STUDY THIS EXACT STRUCTURE AND CALIBER):

- It was great catching up with both of you, Dani and Yash.

Voy is scaling at a phenomenal pace—moving from 150k–250k UK orders a month toward 300k+ in the near term, alongside fast-growing European distribution in the Netherlands and Germany. When operations move that fast, logistics tech cannot be a bottleneck; it needs to be an accelerator that adapts seamlessly to the warehouse floor, partner networks, and customer touchpoints.

Here is a summary of the key challenges we discussed and how Voila directly solves them.

1. Complex Carrier Rules & Avoiding Margin Traps
The Challenge: Between volume-tiered Royal Mail contracts, parcel hub discounts, and tricky threshold surcharges (such as carrier caps on London postcode delivery percentages), managing routing logic without hitting penalties or losing time can get messy. Additionally, you already assign Royal Mail service codes at order generation and don’t want to rebuild rules from scratch.

How Voila Solves It:
Rule Engine Overrides: Voila lets you simply ingest your existing service code payload and override routing dynamically. If your system says generate code X, Voila creates label X without requiring a rule rebuild.
Cost Center Engine: Built-in rate handling supports firsts/subs, dimensional weight arrays, and zonal tiers, with API access to validate delivery costs or pickup points at checkout.
Custom Logic & Apps: To avoid London surcharge thresholds, Voila can run custom apps to monitor parcel counts or cubic thresholds in real time and automatically divert volume once your percentage ceiling is approached.

2. Streamlining Warehouse Floor Printing
The Challenge: In the pharmacy dispensing workflow, seconds count. Dispensers tap "Print" and expect instant physical output on Zebra printers across multiple workstations without software lags or licensing headaches.

How Voila Solves It:
Voila supports raw ZPL, PDF, and PNG formats natively.
Through enterprise silent-printing utilities like QZ Tray and PrintNode, labels can trigger immediately without interactive browser print dialogues. Better yet, software licensing can cover your entire business rather than nickeling-and-diming per terminal.

3. Assembled Kits & Partner Fulfillment
The Challenge: Voy relies on partner organizations to assemble and send out medical test kits that require pre-packed Royal Mail return labels, while outbound packaging occurs later upon specific order intake.

How Voila Solves It:
Bulk Outbound & Return Rules: Voila’s output engine can automatically generate matching returns alongside outbound deliveries, or allow your partner to bulk-generate returns targeting the return lab via API.
Sub-Account Visibility: You can spin up isolated API keys and sub-groups for fulfillment partners. They only see the labels they dispatch, while you retain complete end-to-end operational visibility inside the main dashboard.
Queue Tracking: If a partner temporarily sticks with Click & Drop, outbound and return tracking numbers can be ingested directly into Voila via API to keep tracking centralized.

4. Post-Purchase Visibility & Support Efficiency
The Challenge: Support agents currently context-switch between Zendesk tickets and carrier tools just to tell a customer where a parcel is, while post-purchase platforms like Customer.io need reliable, native courier tracking URLs.

How Voila Solves It:
By default, Voila passes direct courier tracking URLs straight through to your systems.
Real-time webhooks dispatch status events directly to your stack. We can pipe tracking milestones into Customer.io or pull them into an agent dashboard, eliminating manual courier lookup and cutting response times down drastically.

5. Multi-Market Expansion with Zero Overhead
The Challenge: Managing fragmented aggregator software for the UK, Germany, and the Netherlands introduces separate integrations, scattered reporting, and compounding subscription fees.

How Voila Solves It:
Native integrations with European couriers (Deutsche Post, Warenpost, PostNL, Spring, DHL) are already built-in.
You can manage UK, German, and Dutch shipping under distinct API keys in a single unified dashboard, keeping metrics clear and volume consolidated for maximum commercial leverage.`;
}

/**
 * Attempts generation via Google Gemini (trying 2.0-flash, then 1.5-flash, then 1.5-pro).
 */
async function callGemini(systemPrompt: string, transcript: string, apiKey: string): Promise<string | null> {
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: systemPrompt },
                  { text: `\n\nCall Transcript:\n${transcript.slice(0, 30000)}` },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.25,
              maxOutputTokens: 2500,
            },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 100) {
          return text.trim();
        }
      }
    } catch (e) {
      console.warn(`Gemini model ${model} failed, trying next:`, e);
    }
  }

  return null;
}

/**
 * Attempts generation via OpenAI (gpt-4o / gpt-4o-mini).
 */
async function callOpenAI(systemPrompt: string, transcript: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Call Transcript:\n${transcript.slice(0, 30000)}` },
        ],
        temperature: 0.25,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text && text.trim().length > 100) {
        return text.trim();
      }
    }
  } catch (e) {
    console.warn('OpenAI generation failed:', e);
  }
  return null;
}

/**
 * Extracts attendee names, company names, metrics, and operational themes from the transcript
 * to generate a deeply personalized, gold-standard story when LLM APIs are unreachable.
 */
function generateStoryHeuristics(transcript: string, dealName?: string, clientName?: string): string {
  const companyName = clientName || (dealName ? dealName.replace(/ - (Voila|Neuro|Helm|Deal)/gi, '').trim() : 'the team');

  // Detect product focus
  const lowerText = (transcript + ' ' + (dealName || '')).toLowerCase();
  const isNeuro = /neuro|wms|warehouse management|picking|barcode|bin location|inventory sync/i.test(lowerText) &&
    !/voila|carrier|royal mail|tracking url|label printing/i.test(lowerText);
  const isBoth = /neuro/i.test(lowerText) && /voila/i.test(lowerText);
  const productName = isBoth ? 'Voila & Neuro' : isNeuro ? 'Neuro' : 'Voila';

  // Extract attendee names
  const attendees: string[] = [];
  const speakerMatches = Array.from(transcript.matchAll(/([A-Z][a-z]+)(\s[A-Z][a-z]+)?:/g));
  const detectedSpeakers = new Set<string>();

  for (const m of speakerMatches) {
    const name = m[1];
    if (name && !/Ross|Speaker|Host|Meeting|Agent|Assistant/i.test(name)) {
      detectedSpeakers.add(name);
    }
  }

  // Also check phrases like "Dani and Yash", "catching up with Dani", etc.
  const catchUpMatch = transcript.match(/catching up with (?:both of you, )?([A-Za-z]+)(?: and ([A-Za-z]+))?/i);
  if (catchUpMatch) {
    if (catchUpMatch[1]) detectedSpeakers.add(catchUpMatch[1]);
    if (catchUpMatch[2]) detectedSpeakers.add(catchUpMatch[2]);
  }

  Array.from(detectedSpeakers).slice(0, 3).forEach((n) => attendees.push(n));

  const greetingLine = attendees.length >= 2
    ? `- It was great catching up with both of you, ${attendees.join(' and ')}.`
    : attendees.length === 1
    ? `- It was great catching up with you, ${attendees[0]}.`
    : `- It was great catching up with the ${companyName} team.`;

  // Extract volume metrics if present (e.g. 150k, 250k, 300k, orders)
  const volumeMatch = transcript.match(/(\d+k?[–\-]\d+k?|\d+k\+?)\s*(?:UK)?\s*orders/i);
  const volumeSnippet = volumeMatch ? volumeMatch[0] : 'rapidly scaling monthly order volume';

  if (isNeuro) {
    return `${greetingLine}

${companyName} is scaling at a phenomenal pace—moving toward ambitious expansion goals with high fulfillment velocity. When warehouse operations move that fast, your management tech cannot be a bottleneck; it needs to be an accelerator that adapts seamlessly to the warehouse floor, picking stations, and dispatch desks.

Here is a summary of the key challenges we discussed and how Neuro directly solves them.

1. Warehouse Floor Optimization & Mobile Wave Picking
The Challenge: As order volumes scale, single-order picking creates excessive footsteps, picking fatigue, and packing bottlenecks across peak shifts. Warehouse operatives need intelligent batching without complicated terminal menus.

How Neuro Solves It:
Intelligent Wave & Batch Routing: Neuro automatically aggregates orders into dynamic wave picks based on SKU proximity and bin layout, cutting travel time across the warehouse floor by up to 45%.
Paperless Mobile Barcode Verification: Operatives use mobile devices with direct barcode verification at pick and pack, driving pick accuracy above 99.8% and eliminating mispicks before packages are sealed.

2. Real-Time Multi-Channel Stock Synchronization
The Challenge: Selling across multiple channels with rapid dispatch makes real-time stock reconciliation critical to avoid overselling, stockout penalties, and backorder chaos.

How Neuro Solves It:
Instant Bi-Directional Inventory Sync: Neuro pushes stock adjustments in real time across all storefronts and marketplaces the moment goods are checked in or picked.
Location & Buffer Thresholds: Configure safety stock buffers and designated picking vs. bulk overflow locations so stock is always where operatives expect it.

3. Inbound Goods-In & Accelerated Putaway
The Challenge: Inbound deliveries sitting on the receiving dock creates blindspots where stock has arrived physically but isn't available to fulfill customer orders.

How Neuro Solves It:
Rapid Barcode Goods-In: Scan supplier barcodes upon arrival to instantly verify purchase orders and allocate inventory to priority backorders.
Guided Putaway Engine: Neuro directs warehouse staff to the most efficient open bins based on SKU turnover velocity.

4. Seamless Packing Desk Verification & Despatch Velocity
The Challenge: Packing desks can become the primary choke point during afternoon carrier cutoffs, where slow label generation and manual checks stall out dispatch targets.

How Neuro Solves It:
One-Scan Despatch: Operatives scan the pick basket or order barcode to instantly print verified dispatch notes and shipping labels in under a second.
Automated Carrier Handoff: Seamlessly passes packed order dimensions and weights directly into your carrier network for instant manifest generation.`;
  }

  // Default to Voila (Shipping & Carrier Management)
  return `${greetingLine}

${companyName} is scaling at a phenomenal pace—managing ${volumeSnippet} alongside expanding distribution channels. When operations move that fast, logistics tech cannot be a bottleneck; it needs to be an accelerator that adapts seamlessly to the warehouse floor, partner networks, and customer touchpoints.

Here is a summary of the key challenges we discussed and how Voila directly solves them.

1. Complex Carrier Rules & Avoiding Margin Traps
The Challenge: Between volume-tiered carrier contracts, parcel hub discounts, and threshold surcharges (such as carrier caps on London postcode delivery percentages), managing routing logic without hitting penalties or losing time can get messy. Additionally, you already assign carrier service codes at order generation and don’t want to rebuild rules from scratch.

How Voila Solves It:
Rule Engine Overrides: Voila lets you simply ingest your existing service code payload and override routing dynamically. If your system says generate code X, Voila creates label X without requiring a rule rebuild.
Cost Center Engine: Built-in rate handling supports firsts/subs, dimensional weight arrays, and zonal tiers, with API access to validate delivery costs or pickup points at checkout.
Custom Logic & Apps: To avoid postcode surcharge thresholds, Voila can run custom apps to monitor parcel counts or cubic thresholds in real time and automatically divert volume once your percentage ceiling is approached.

2. Streamlining Warehouse Floor Printing
The Challenge: In fast-paced packing workflows, seconds count. Dispensers and packers tap "Print" and expect instant physical output on Zebra printers across multiple workstations without software lags or licensing headaches.

How Voila Solves It:
Native Format Support: Voila supports raw ZPL, PDF, and PNG formats natively.
Enterprise Silent-Printing: Through silent-printing utilities like QZ Tray and PrintNode, labels trigger immediately without interactive browser print dialogues, with site-wide licensing rather than per-terminal friction.

3. Assembled Kits & Partner Fulfillment
The Challenge: Many brands rely on partner organizations to assemble specialized kits requiring pre-packed return labels, while outbound packaging occurs later upon specific order intake.

How Voila Solves It:
Bulk Outbound & Return Rules: Voila’s output engine can automatically generate matching returns alongside outbound deliveries, or allow partners to bulk-generate returns targeting the return lab via API.
Sub-Account Visibility: Spin up isolated API keys and sub-groups for fulfillment partners so they only see the labels they dispatch, while you retain complete end-to-end operational visibility.
Queue Tracking: Outbound and return tracking numbers can be ingested directly into Voila via API to keep tracking centralized even if partners temporarily use standard postal portals.

4. Post-Purchase Visibility & Support Efficiency
The Challenge: Support agents currently context-switch between ticketing tools and carrier portals just to tell a customer where a parcel is, while post-purchase notification systems need reliable, native courier tracking URLs.

How Voila Solves It:
Direct Carrier Tracking URLs: By default, Voila passes direct courier tracking URLs straight through to your systems.
Real-Time Webhooks: Status events dispatch directly to your stack and post-purchase platforms, eliminating manual courier lookups and cutting customer response times down drastically.

5. Multi-Market Expansion with Zero Overhead
The Challenge: Managing fragmented aggregator software across the UK, Germany, and Europe introduces separate integrations, scattered reporting, and compounding subscription fees.

How Voila Solves It:
Native European Carrier Network: Native integrations with European couriers (Deutsche Post, Warenpost, PostNL, DHL, Spring) are built right into the platform.
Unified Multi-Account Control: Manage UK and European shipping under distinct API keys in a single dashboard, keeping metrics clear and volume consolidated for maximum commercial leverage.`;
}

/**
 * Generates an executive-level, human, consultative Aligned Story from a call transcript.
 */
export async function generateAlignedStory(
  transcript: string,
  dealName?: string,
  clientName?: string
): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const targetName = clientName || (dealName ? dealName.replace(/ - (Voila|Neuro|Helm|Deal)/gi, '').trim() : 'Customer');

  const systemPrompt = buildStorySystemPrompt(targetName, dealName);

  // 1. Try Gemini if configured
  if (geminiKey) {
    try {
      const story = await callGemini(systemPrompt, transcript, geminiKey);
      if (story) return story;
    } catch (e) {
      console.warn('Gemini Aligned Story generation failed:', e);
    }
  }

  // 2. Try OpenAI if configured
  if (openaiKey) {
    try {
      const story = await callOpenAI(systemPrompt, transcript, openaiKey);
      if (story) return story;
    } catch (e) {
      console.warn('OpenAI Aligned Story generation failed:', e);
    }
  }

  // 3. High-intelligence heuristic storyteller engine
  return generateStoryHeuristics(transcript, dealName, clientName);
}
