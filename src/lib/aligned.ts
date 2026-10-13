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
 * Builds the storyteller system prompt with few-shot calibration based on Ross Jermy's exact Shipa & Voy gems.
 */
function buildStorySystemPrompt(targetName: string, dealName?: string): string {
  return `You are Ross Jermy, Senior Commercial Sales Consultant at Despatch Cloud (representing Voila and Neuro).
You have just concluded an in-depth sales discovery call with ${targetName}.
Your objective is to read the call transcript and write a bespoke, high-impact, consultative "Deal Room Story" to be pasted directly into their customer-facing Aligned Digital Sales Room (Aligned.so) or sent as an executive follow-up.

VOICE & TONE (NON-NEGOTIABLE RULES):
- You are writing directly to the client stakeholders (e.g., "Hi Steven,", "It was great catching up yesterday...").
- ZERO AI CLICHÉS:
  * Do NOT use cheesy emojis in headings (NO 🤝, 📌, 🚨, 💡, 🎯).
  * Do NOT use generic corporate buzzwords ("In today's fast-paced world", "synergies", "seamlessly streamline", "welcome to your collaboration room").
  * Do NOT use generic logistics bullet points. Every single paragraph and bullet MUST be derived directly from the real discussion in the transcript.
- MAXIMUM PERSONALIZATION:
  * Open with real human rapport: if a personal joke, shared interest, or lighthearted moment was mentioned (e.g. Star Wars collections, travel plans, local weather, shared experiences), weave it naturally into the opening.
  * Explicitly identify their unique commercial model, current volume numbers (e.g. 600 parcels/day, 150k-300k orders/mo), shipping lanes (e.g. UK to GCC, European distribution in Germany/Netherlands), and exact technology platforms (e.g. Linnworks, Shopify, TikTok Shop, Temu, Zebra printers, Zendesk, Customer.io).
  * Pinpoint their exact roadblocks and internal friction (e.g. dev queue backlog, merchant deals stalled on Linnworks, London surcharge limits, pharmacy dispensing print lags).

PRODUCT ARCHITECTURE (VOILA & NEURO):
Map their exact pain points to the right product:
1. "Voila": Carrier API connectivity, multi-carrier routing, shipping label generation, Linnworks/Shopify access without client dev effort (we build the carrier API on our side), access to our network of 60+ UK 3PLs, silent warehouse printing (ZPL/PDF via QZ Tray & PrintNode), tracking webhooks, London surcharge avoidance, European courier injection (PostNL, Deutsche Post, DHL).
2. "Neuro": Upstream marketplace aggregator & modern WMS, 400+ channel connections (TikTok Shop, Amazon, Temu, eBay) eliminating manual CSV uploads, complimentary 12-month trial runway (e.g. up to 2,500 orders/month), mobile barcode picking, real-time inventory sync.

STORYTELLING BLUEPRINT (FOLLOW THIS EXACT ARCHITECTURE):

Hi [Stakeholder Name],

It was great catching up yesterday—[warm, specific personal rapport reference from call]!

Following up on our conversation, I wanted to put together a clear, tailored narrative of what we discussed, the bottlenecks you’re currently bumping into at [Company], and exactly how plugging into our ecosystem fixes them without bogging your tech team down.

---

### The Story So Far: [Company]’s Strong Lane & The Integration Bottleneck

[2-3 sentences explaining their unique commercial niche, strengths, shipping lane, order volumes, or fulfillment model].

However, scaling that volume has hit a few classic integration roadblocks:

1. **[Specific Blocker Name, e.g. The Linnworks Barrier]:** [Specific situation, citing actual numbers, stalled deals, or customer resistance].
2. **[Specific Blocker Name, e.g. Dev Queue Constraints]:** [Internal bandwidth and opportunity cost].
3. **[Specific Blocker Name, e.g. Restricted Marketplace Ingestion]:** [Current manual workarounds or non-supported channels].

---

### How Voila & Neuro Solve This

Rather than building, maintaining, and certifying separate API connections for every platform your prospects use, our tools sit on either side of your infrastructure to bridge the gap instantly:

#### 1. Voila: [Specific Strategic Outcome, e.g. Instant Linnworks Access & Network Scale]
* **Zero Dev Effort for Your Tech Team:** You supply your API credentials and specification; **we build your carrier API connection into Voila on our side**. There is nothing for your internal developers to build.
* **Plug & Play for Sellers:** Once connected, any user can instantly generate labels right within their existing workflow.
* **Immediate Reach across 60+ UK 3PLs:** Connecting to Voila automatically opens your services to our network of over 60 third-party logistics providers and enterprise merchants.

#### 2. Neuro: [Specific Strategic Outcome, e.g. Effortless Marketplace Connectivity (Complimentary for 12 Months)]
* **400+ Channels with One Connection:** Neuro acts as an upstream aggregator, pulling orders directly from high-growth channels (TikTok Shop, Amazon, Temu, eBay) into your platform, eliminating CSV uploads.
* **Free Trial Runway:** To give you plenty of space to test customer uptake, we include **Neuro free for 12 months** (up to 2,500 orders/month) alongside Voila with zero financial risk.

---

### Next Steps

[Specific next commitments agreed on the call: pricing bands, upcoming team meetings, travel mentions, and next milestone].

Best regards,

**Ross Jermy**

---

FEW-SHOT MASTER REFERENCE (STUDY THIS CALIBER AND DEPTH):

Hi Steven,

It was great catching up yesterday—especially after realizing that beyond cross-border logistics, we share a mutual pain when it comes to giving away childhood Star Wars collections that would now be worth a small fortune!

Following up on our conversation, I wanted to put together a clear, tailored narrative of what we discussed, the bottlenecks you’re currently bumping into at Agility/Shipa, and exactly how plugging into our ecosystem fixes them without bogging your tech team down.

---

### The Story So Far: Shipa’s Strong Lane & The Integration Bottleneck

Shipa E-Commerce has carved out a compelling, high-performing niche: two-to-four day transit times from the UK into the GCC with express reliability at commercial e-commerce rates. You own the middle mile, customs clearance, and final-mile injection, completely cutting out the third-party middleman.

However, scaling that volume in the UK market has hit a few classic integration roadblocks:

1. **The Linnworks Barrier:** You’ve had serious merchant interest—including prospective deals doing around 600 parcels a day into the GCC—stall simply because Shipa isn’t natively integrated with Linnworks. E-commerce sellers and brands demand convenience; if they can't print a label directly out of their core order management workflow, they won't switch.

2. **Dev Queue Constraints:** Building individual, direct integrations to platforms like Linnworks in-house burns valuable development bandwidth—bandwidth that is better spent scaling Shipa's core products and global routing.

3. **Restricted Marketplace Ingestion:** On the front end, relying on single-label creation or manual CSV batch uploads limits how easily non-Shopify merchants (like those exploding on TikTok Shop or Temu) can inject their orders directly into your system.

---

### How Voila & Neuro Solve This

Rather than building, maintaining, and certifying separate API connections for every platform your prospects use, our tools sit on either side of your infrastructure to bridge the gap instantly:

#### 1. Voila: Instant Linnworks Access & Network Scale

* **Zero Dev Effort for Your Tech Team:** You supply your API credentials and specification; **we build your carrier API connection into Voila on our side**. There is nothing for your internal developers to build to unlock Linnworks.

* **Plug & Play for Sellers:** Once connected, any Linnworks user can instantly generate Shipa GCC labels right within their existing workflow.

* **Immediate Reach across 60+ UK 3PLs:** Connecting to Voila doesn't just solve Linnworks—it automatically opens Shipa’s services to our network of over 60 third-party logistics providers and enterprise merchants who utilize our ecosystem every day.

#### 2. Neuro: Effortless Marketplace Connectivity (Complimentary for 12 Months)

* **400+ Channels with One Connection:** Neuro acts as an upstream aggregator, pulling orders directly from high-growth channels (TikTok Shop, Amazon, Temu, eBay) into your platform, eliminating CSV uploads for your clients.

* **Free Trial Runway:** To give you plenty of space to test customer uptake, we include **Neuro free for 12 months** (up to 2,500 orders/month) alongside Voila so your team can test marketplace ingestion with zero financial risk.

---

### Next Steps

As promised, I’ll follow this note with our tiered pricing structure so you can review the volume bands. Once you’ve caught up with your team face-to-face in Dubai next week, we can lock in the API credentials, get your carrier profile mapped onto Voila, and start unlocking those stalled Linnworks opportunities.

Safe travels back to Dubai on Sunday!

Best regards,

**Ross Jermy**`;
}

/**
 * Calls Gemini models (gemini-2.0-flash, gemini-1.5-flash, gemini-1.5-pro).
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
                  { text: `\n\nCall Transcript to Analyze:\n${transcript}` },
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
          { role: 'user', content: `Call Transcript to Analyze:\n${transcript}` },
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
    if (story) return story;
  }

  // 2. Try OpenAI if configured
  if (openaiKey) {
    const story = await callOpenAI(systemPrompt, transcript, openaiKey);
    if (story) return story;
  }

  // If no LLM key is configured, do NOT generate fake generic text. Inform the user clearly!
  throw new Error(
    'No AI API key found. Please add GEMINI_API_KEY or OPENAI_API_KEY to your .env file so the model can read and analyze the transcript.'
  );
}
