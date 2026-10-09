import { TranscriptAnalysisResult } from './types';

export async function analyzeTranscript(
  transcript: string,
  dealName?: string,
  dealStage?: string
): Promise<TranscriptAnalysisResult> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    try {
      return await analyzeWithGemini(transcript, dealName, dealStage, geminiKey);
    } catch (e) {
      console.warn('Gemini analysis failed, falling back to smart heuristic engine:', e);
    }
  }

  if (openaiKey) {
    try {
      return await analyzeWithOpenAI(transcript, dealName, dealStage, openaiKey);
    } catch (e) {
      console.warn('OpenAI analysis failed, falling back to smart heuristic engine:', e);
    }
  }

  // Fallback to high-quality heuristic extraction engine
  return heuristicAnalysis(transcript, dealName);
}

async function analyzeWithGemini(
  transcript: string,
  dealName: string | undefined,
  dealStage: string | undefined,
  apiKey: string
): Promise<TranscriptAnalysisResult> {
  const prompt = `You are an elite B2B sales intelligence agent for Despatch Cloud (shipping, warehousing, multi-carrier management software).
Analyze this call transcript for Deal: "${dealName || 'Unknown'}" (Stage: "${dealStage || 'Active'}").

Transcript:
${transcript.slice(0, 15000)}

Return ONLY valid JSON matching this exact structure:
{
  "summary": "Concise 2-3 sentence executive recap of the conversation and outcome.",
  "dealHealth": "strong" | "moderate" | "at_risk",
  "urgencyScore": number from 1 to 100,
  "buyingSignals": ["list of positive signals, budget indications, or urgent timelines"],
  "objections": ["list of hesitations, competitor mentions, pricing questions, technical blockers"],
  "despatchCloudFit": ["specific DC features or capabilities discussed like WMS, Voila, carriers, automations"],
  "commitmentsMade": {
    "byRoss": ["commitments or deliverables Ross promised to send"],
    "byClient": ["commitments or next steps promised by the prospect/client"]
  },
  "recommendedNextAction": "The single highest-leverage next move Ross should execute immediately.",
  "suggestedFollowUpEmail": {
    "subject": "Compelling subject line",
    "body": "Polished, highly professional email text written from Ross Jermy referencing specific nuances from the meeting."
  }
}`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });

  if (!res.ok) throw new Error(`Gemini API error: ${res.statusText}`);
  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  return JSON.parse(rawText);
}

async function analyzeWithOpenAI(
  transcript: string,
  dealName: string | undefined,
  dealStage: string | undefined,
  apiKey: string
): Promise<TranscriptAnalysisResult> {
  const prompt = `You are an elite B2B sales intelligence agent for Despatch Cloud.
Analyze this call transcript for Deal: "${dealName || 'Unknown'}" (Stage: "${dealStage || 'Active'}").
Return JSON matching:
{
  "summary": "2-3 sentences recap",
  "dealHealth": "strong" | "moderate" | "at_risk",
  "urgencyScore": number (1-100),
  "buyingSignals": string[],
  "objections": string[],
  "despatchCloudFit": string[],
  "commitmentsMade": { "byRoss": string[], "byClient": string[] },
  "recommendedNextAction": string,
  "suggestedFollowUpEmail": { "subject": string, "body": string }
}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: transcript.slice(0, 15000) },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI API error: ${res.statusText}`);
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content || '{}');
}

function heuristicAnalysis(transcript: string, dealName?: string): TranscriptAnalysisResult {
  const lines = transcript.split('\n').filter((l) => l.trim().length > 0);
  const lower = transcript.toLowerCase();

  const buyingSignals: string[] = [];
  const objections: string[] = [];
  const dcFit: string[] = [];
  const commitmentsRoss: string[] = [];
  const commitmentsClient: string[] = [];

  // Keywords detection
  if (lower.includes('contract') || lower.includes('pricing') || lower.includes('quote') || lower.includes('proposal')) {
    buyingSignals.push('Requested formal commercial terms / pricing proposal');
  }
  if (lower.includes('timeline') || lower.includes('asap') || lower.includes('go live') || lower.includes('start date')) {
    buyingSignals.push('Active go-live timeline discussed');
  }
  if (lower.includes('demo') || lower.includes('great') || lower.includes('makes sense') || lower.includes('love that')) {
    buyingSignals.push('Strong positive feedback on system workflow');
  }

  // Objections
  if (lower.includes('expensive') || lower.includes('budget') || lower.includes('cost')) {
    objections.push('Budget sensitivity or pricing scrutiny');
  }
  if (lower.includes('integration') || lower.includes('api') || lower.includes('legacy') || lower.includes('custom')) {
    objections.push('Technical validation needed regarding existing system integrations');
  }
  if (lower.includes('internal team') || lower.includes('board') || lower.includes('stakeholder') || lower.includes('boss')) {
    objections.push('Decision requires multi-stakeholder consensus');
  }

  // Despatch Cloud capability matches
  if (lower.includes('voila')) dcFit.push('Voila Dispatch Automation');
  if (lower.includes('wms') || lower.includes('warehouse')) dcFit.push('Despatch Cloud Warehouse Management (WMS)');
  if (lower.includes('carrier') || lower.includes('shipping') || lower.includes('royal mail') || lower.includes('dpd')) {
    dcFit.push('Multi-Carrier Shipping Management');
  }
  if (lower.includes('barcode') || lower.includes('scanning') || lower.includes('picking')) {
    dcFit.push('Barcode Scanning & Picking Optimization');
  }
  if (dcFit.length === 0) {
    dcFit.push('Despatch Cloud Logistics & Order Processing Suite');
  }

  // Commitments extraction
  lines.forEach((line) => {
    const l = line.toLowerCase();
    if (l.includes("i'll send") || l.includes('i will send') || l.includes("i'll get back") || l.includes("i'll follow up")) {
      if (l.includes('ross') || (!l.includes('client') && commitmentsRoss.length < 3)) {
        commitmentsRoss.push(line.trim().slice(0, 120));
      }
    }
    if (l.includes("we'll review") || l.includes('we will check') || l.includes("i'll speak with") || l.includes('get back to you by')) {
      if (commitmentsClient.length < 3) {
        commitmentsClient.push(line.trim().slice(0, 120));
      }
    }
  });

  if (commitmentsRoss.length === 0) {
    commitmentsRoss.push('Send summarized recap with tailored Despatch Cloud walkthrough');
  }
  if (commitmentsClient.length === 0) {
    commitmentsClient.push('Review requirements with internal operations team');
  }

  const urgencyScore = Math.min(
    95,
    Math.max(40, 50 + buyingSignals.length * 15 - objections.length * 10)
  );

  const health = urgencyScore > 75 ? 'strong' : urgencyScore > 50 ? 'moderate' : 'at_risk';

  const clientName = dealName ? dealName.split('-')[0].trim() : 'Team';

  return {
    summary: `Meeting held with ${clientName} reviewing logistical pain points and current fulfilment operations. Key interest centered on ${dcFit.join(', ')}. Next steps aligned around commercial proposal and technical scope.`,
    dealHealth: health,
    urgencyScore,
    buyingSignals: buyingSignals.length > 0 ? buyingSignals : ['Operational alignment established during discovery call'],
    objections: objections.length > 0 ? objections : ['Standard procurement review timeline'],
    despatchCloudFit: dcFit,
    commitmentsMade: {
      byRoss: commitmentsRoss,
      byClient: commitmentsClient,
    },
    recommendedNextAction: `Send structured follow-up email outlining the discussed Despatch Cloud solution and confirm target go-live date.`,
    suggestedFollowUpEmail: {
      subject: `Great speaking today - Despatch Cloud next steps for ${clientName}`,
      body: `Hi there,\n\nThank you for the time today. It was great learning more about your current operational setup and where you're looking to streamline fulfilment.\n\nTo recap what we covered:\n• Addressed your core priorities around ${dcFit.slice(0, 2).join(' and ')}\n• Clarified next steps regarding internal review\n\nAs promised, I'll follow up with the requested details. In the meantime, please let me know if any questions come up from your side.\n\nBest regards,\nRoss Jermy\nDespatch Cloud`,
    },
  };
}
