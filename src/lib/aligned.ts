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

export { cleanStoryToUkEnglish } from './story-cleaner';
import { cleanStoryToUkEnglish } from './story-cleaner';

/**
 * Builds the storyteller system prompt with few-shot calibration based on Ross Jermy's exact Shipa & Voy gems.
 */
function buildStorySystemPrompt(targetName: string, dealName?: string): string {
  return `You are Ross Jermy, Enterprise Account Executive at The Despatch Company (representing Voila and Neuro).
You have just concluded an in-depth sales discovery call with ${targetName}.
Your objective is to read the call transcript and write a bespoke, clean, consultative "Deal Room Story" to be pasted directly into their customer-facing Aligned Digital Sales Room (Aligned.so) or sent as an executive follow-up.

LANGUAGE & SPELLING RULES (MANDATORY UK ENGLISH):
- You MUST write in strict British / UK English.
- NEVER use an American 'z' where an 's' belongs:
  * Use "prioritise" (NOT prioritize)
  * Use "customised" (NOT customized)
  * Use "optimised" (NOT optimized)
  * Use "organise" (NOT organize)
  * Use "realising" (NOT realizing)
  * Use "fulfilment" (NOT fulfillment)
  * Use "centre" (NOT center)
- Any Americanised spelling with a 'z' is strictly unacceptable.

FORMATTING & TYPOGRAPHY (CLEAN & ASTERISK-FREE):
- ABSOLUTELY NO ASTERISKS: Do NOT use markdown bold asterisks (NO **text** and NO *text*).
- Do NOT use cheesy emojis anywhere in headings (NO 🤝, 📌, 🚨, 💡, 🎯).
- Do NOT use markdown hashtags (NO ### or ####). Write clean, beautiful section headings.
- Use clean bullet symbols • for sub-points.
- ZERO AI CLICHÉS: No generic buzzwords ("In today's fast-paced world", "synergies", "seamlessly streamline", "welcome to your collaboration room").

MAXIMUM PERSONALIZATION:
- Open with real human rapport: if a personal joke, shared interest, or lighthearted moment was mentioned (e.g. Star Wars collections, travel plans, local weather, shared experiences), weave it naturally into the opening.
- Explicitly identify their unique commercial model, current volume numbers (e.g. 600 parcels/day, 150k-300k orders/mo), shipping lanes (e.g. UK to GCC, European distribution in Germany/Netherlands), and exact technology platforms (e.g. Linnworks, Shopify, TikTok Shop, Temu, Zebra printers, Zendesk, Customer.io).
- Pinpoint their exact roadblocks and internal friction (e.g. dev queue backlog, merchant deals stalled on Linnworks, London surcharge limits, pharmacy dispensing print lags).

PRODUCT ARCHITECTURE (VOILA & NEURO):
Map their exact pain points to the right product:
1. "Voila": Carrier API connectivity, multi-carrier routing, shipping label generation, Linnworks/Shopify access without client dev effort (we build the carrier API on our side), access to our network of 60+ UK 3PLs, silent warehouse printing (ZPL/PDF via QZ Tray & PrintNode), tracking webhooks, London surcharge avoidance, European courier injection (PostNL, Deutsche Post, DHL).
2. "Neuro": Upstream marketplace aggregator & modern WMS, 400+ channel connections (TikTok Shop, Amazon, Temu, eBay) eliminating manual CSV uploads, complimentary 12-month trial runway (e.g. up to 2,500 orders/month), mobile barcode picking, real-time inventory sync.

STORYTELLING BLUEPRINT:

Hi [Stakeholder Name],

It was great catching up yesterday—[warm, specific personal rapport reference from call]!

Following up on our conversation, I wanted to put together a clear, tailored narrative of what we discussed, the bottlenecks you’re currently bumping into at [Company], and exactly how plugging into our ecosystem fixes them without bogging your tech team down.

---

The Story So Far: [Company]’s Strong Lane & The Integration Bottleneck

[2-3 sentences explaining their unique commercial niche, strengths, shipping lane, order volumes, or fulfilment model].

However, scaling that volume has run straight into classic integration roadblocks:

1. [Specific Blocker Name, e.g. The Linnworks Barrier]: [Specific situation, citing actual numbers, stalled deals, or customer resistance].
2. [Specific Blocker Name, e.g. Dev Queue Constraints]: [Internal bandwidth and engineering opportunity cost].
3. [Specific Blocker Name, e.g. Restricted Marketplace Ingestion]: [Current manual workarounds or non-supported channels].

---

How Voila & Neuro Solve This

Rather than requiring your tech team to build and maintain separate API integrations for every platform your prospects use, our tools sit on either side of your infrastructure to bridge the gap instantly:

Voila: [Specific Strategic Outcome, e.g. Instant Linnworks Access & Network Scale]
• Zero Dev Effort for Your Tech Team: You supply your API credentials and specification; we build your carrier API connection into Voila on our side. Your internal developers do not need to build or maintain a Linnworks integration.
• Plug & Play for Sellers: Once connected, any Linnworks merchant can immediately select your service and generate compliant labels directly within their existing dispatch workflow.
• Immediate Reach across 60+ UK 3PLs: Connecting to Voila automatically opens your services to our network of over 60 third-party logistics providers and enterprise merchants already running on our software.

Neuro: [Specific Strategic Outcome, e.g. Effortless Marketplace Connectivity (Complimentary for 12 Months)]
• 400+ Channels with One Connection: Neuro acts as an upstream aggregator, pulling orders directly from high-growth marketplaces (TikTok Shop, Amazon, Temu, eBay) straight into your system, eliminating manual CSV uploads for your clients.
• Free Trial Runway: To give you plenty of runway to validate customer adoption, we include Neuro free for 12 months (up to 2,500 orders/month) alongside Voila, allowing your team to test automated marketplace ingestion with zero financial risk.

---

Next Steps

• [Specific next commitments agreed on the call: pricing bands, upcoming team meetings, travel mentions, and next milestone].

Best regards,

Ross Jermy
Enterprise Account Executive
The Despatch Company (Voila & Neuro)

---

FEW-SHOT MASTER REFERENCE (STUDY THIS EXACT CLEAN FORMAT):

Hi Steven,

It was great catching up yesterday—especially commiserating over our shared childhood tragedy of giving away original Star Wars collections that would easily fund a small fleet of Star Destroyers today!

Following up on our conversation, I wanted to put together a clear, tailored narrative of what we discussed, the bottlenecks you’re currently bumping into at Shipa, and exactly how plugging into our ecosystem fixes them without bogging your tech team down.

---

The Story So Far: Shipa’s Strong Lane & The Integration Bottleneck

Shipa E-Commerce has carved out a distinct, high-performing lane: reliable two-to-four day transit times from the UK into the GCC (handling daily line-hauls into DXB and Riyadh) at commercial e-commerce pricing. By controlling your own middle mile, in-house customs clearance, and final-mile delivery out of your Colnbrook hub, you eliminate third-party markups and service failures for categories like beauty, supplements, and fashion.

However, scaling that UK export volume has run straight into classic integration roadblocks:

1. The Linnworks Barrier: High-volume opportunities—including prospective merchant deals generating around 600 parcels a day into the GCC—have stalled simply because Shipa lacks a native Linnworks integration. E-commerce merchants and brands prioritise operational convenience above all else; if warehouse staff cannot generate a Shipa label directly within their existing Linnworks picking and dispatch flow, they will stay put with slower, more expensive legacy carriers.
2. Dev Queue Constraints: Building, certifying, and maintaining individual carrier applications in-house for every major order management system ties up valuable developer bandwidth—bandwidth your engineering team needs to keep focused on core logistics, customs infrastructure, and routing.
3. Restricted Marketplace Ingestion: On the merchant intake side, relying on manual single-label generation or CSV batch uploads limits how effectively you can onboard brands scaling rapidly on non-Shopify channels, specifically fast-growing platforms like TikTok Shop and Temu.

---

How Voila & Neuro Solve This

Rather than requiring your tech team to build and maintain separate API integrations for every platform your prospects use, our tools sit on either side of your infrastructure to bridge the gap instantly:

Voila: Instant Linnworks Access & Network Scale
• Zero Dev Effort for Your Tech Team: You supply your API credentials and specification; we build your carrier API connection into Voila on our side. Your internal developers do not need to build or maintain a Linnworks integration.
• Plug & Play for Sellers: Once connected, any Linnworks merchant can immediately select Shipa and generate compliant GCC labels directly within their existing dispatch workflow.
• Immediate Reach across 60+ UK 3PLs: Connecting to Voila doesn't just unlock Linnworks; it immediately exposes Shipa’s GCC routing across our network of over 60 third-party logistics providers and enterprise fulfilment houses already running on our software.

Neuro: Effortless Marketplace Connectivity (Complimentary for 12 Months)
• 400+ Channels with One Connection: Neuro acts as an upstream aggregator, pulling orders directly from high-growth marketplaces (TikTok Shop, Amazon, Temu, eBay) straight into your system, eliminating manual CSV uploads for your clients.
• Free Trial Runway: To give you plenty of runway to validate customer adoption, we include Neuro free for 12 months (up to 2,500 orders/month) alongside Voila, allowing your team to test automated marketplace ingestion with zero financial risk.

---

Next Steps

• Commercial Review: I am sending over our tiered label volume pricing bands alongside this note so you can assess the structure before speaking with the wider team.
• Dubai Team Review: Once you've caught up with your tech and commercial colleagues face-to-face in Dubai next week, we can confirm the appropriate volume tier.
• Technical Onboarding: We will collect your carrier API specification and credentials, map Shipa into Voila, and immediately unblock those stalled Linnworks accounts.
• Rate Exchange: Send over your GCC tariff card when convenient; I'd like to look at running our London fashion merchant's Middle East volume through your service.

Safe travels flying back to Dubai on Sunday.

Best regards,

Ross Jermy
Enterprise Account Executive
The Despatch Company (Voila & Neuro)`;
}

/**
 * Calls Gemini models (gemini-3.8-flash, gemini-flash-latest, etc.).
 */
async function callGemini(systemPrompt: string, transcript: string, apiKey: string): Promise<string | null> {
  const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-pro-latest', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

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
                  { text: `\n\nCall Transcript to Analyse:\n${transcript}` },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.25,
              maxOutputTokens: 3000,
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
      console.warn(`Gemini model ${model} failed:`, e);
    }
  }

  return null;
}

/**
 * Calls OpenAI (gpt-4o).
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
          { role: 'user', content: `Call Transcript to Analyse:\n${transcript}` },
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

  if (!transcript || transcript.trim().length < 50) {
    throw new Error('No transcript content was provided. Please select a valid Fireflies call or paste the transcript text.');
  }

  const systemPrompt = buildStorySystemPrompt(targetName, dealName);

  // 1. Try Gemini if configured
  if (geminiKey) {
    const story = await callGemini(systemPrompt, transcript, geminiKey);
    if (story) return cleanStoryToUkEnglish(story);
  }

  // 2. Try OpenAI if configured
  if (openaiKey) {
    const story = await callOpenAI(systemPrompt, transcript, openaiKey);
    if (story) return cleanStoryToUkEnglish(story);
  }

  // If no LLM key is configured, inform the user clearly
  throw new Error(
    'No AI API key found. Please add GEMINI_API_KEY or OPENAI_API_KEY to your .env file so the model can read and analyse the transcript.'
  );
}
