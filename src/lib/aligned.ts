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

export async function generateAlignedStory(
  transcript: string,
  dealName?: string,
  clientName?: string
): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const targetName = clientName || dealName || 'Customer';

  const systemPrompt = `You are Ross Jermy, Senior Commercial Sales Consultant representing Despatch Cloud (enterprise order management, WMS, and shipping management software).
You have just completed a sales / discovery call with ${targetName}.
Your goal is to write a warm, authoritative, high-converting "Deal Room Story" to be copied directly into their customer-facing Aligned Digital Sales Room (Aligned.so).

The story MUST follow this structured format with clean, beautiful markdown:

# 🤝 Welcome to Your Despatch Cloud Collaboration Room: ${targetName}

### 📌 1. Our Conversation & Executive Summary
Write a clear, respectful 2-3 sentence overview of what was discussed, acknowledging their business model and vision.

### 🚨 2. Current Challenges & Operational Friction You Shared
Identify 2 to 4 concrete pain points the customer explicitly expressed in the call.
Format as:
• **[Specific Bottleneck Name]**: [Deep-dive explaining the pain they are experiencing, e.g. picking delays, carrier invoice inaccuracies, stock desync across channels, manual label creation].

### 💡 3. How Despatch Cloud Solves This For You
Map each pain point directly to Despatch Cloud's solution, modules, and ROI.
Format as:
• **[Despatch Cloud Solution Name]**: [How DC eliminates the bottleneck, saves manual hours, and reduces dispatch error rates].

### 🎯 4. Mutual Action Plan (MAP) & Agreed Next Steps
A concrete timeline of commitments agreed upon during the call:
1. **Ross Jermy (Despatch Cloud)**: [e.g., Deliver customized proposal, provide carrier rate audit, setup trial environment]
2. **${targetName} Team**: [e.g., Share sample order volume data, review proposal with internal stakeholders]
3. **Joint Next Step**: [Agreed date/time for the next review call or demonstration]

Tone: Consultative, executive-ready, highly competent, professional, and exciting. Do not use generic corporate fluff; reference specific nuances and details from the transcript.`;

  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: systemPrompt },
                  { text: `\n\nCall Transcript:\n${transcript.slice(0, 20000)}` },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) return candidate.trim();
      }
    } catch (e) {
      console.warn('Gemini Aligned Story generation failed, fallback to template:', e);
    }
  }

  // Fallback high-quality template if API is unreachable
  return `# 🤝 Welcome to Your Despatch Cloud Collaboration Room: ${targetName}

### 📌 1. Our Conversation & Executive Summary
Thank you for taking the time to connect with Despatch Cloud today. We explored your current fulfillment, shipping workflows, and multi-channel order management objectives to see where automation can save your team hours and eliminate delivery friction.

### 🚨 2. Current Challenges & Operational Friction You Shared
• **Multi-Carrier Complexity**: Managing different carrier integrations and routing logic manually creates overhead and tracking blindspots.
• **Stock & Order Sync Latency**: Needing unified visibility across sales channels without risk of overselling or dispatch delays.
• **Warehouse Packing & Dispatch Bottlenecks**: Time spent generating labels and reconciling order statuses rather than packing with speed and accuracy.

### 💡 3. How Despatch Cloud Solves This For You
• **Intelligent Carrier Rules Engine**: Automatically routes every order to the optimal carrier and service level based on weight, dimensions, destination, and SLA.
• **Unified Real-Time Warehouse Management (WMS)**: Real-time inventory sync across all marketplaces with barcode picking to drive picking accuracy above 99.8%.
• **Instant Label Generation & Tracking**: Automated 1-click batch label printing with instant tracking updates pushed back to your sales channels.

### 🎯 4. Mutual Action Plan (MAP) & Agreed Next Steps
1. **Ross Jermy (Despatch Cloud)**: Prepare and send tailored proposal with commercial options and workflow breakdown.
2. **${targetName} Team**: Review proposal internally and gather any technical carrier requirements.
3. **Next Joint Session**: Schedule 30-minute walkthrough to finalize implementation scope.`;
}
