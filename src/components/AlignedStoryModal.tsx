'use client';

import React, { useState, useEffect } from 'react';
import { Deal } from '@/lib/types';
import { 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw, 
  Radio, 
  FileText, 
  CheckCircle2, 
  ExternalLink,
  Save
} from 'lucide-react';

interface AlignedStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal | null;
  onStorySaved?: (dealId: string, story: string) => void;
}

export function AlignedStoryModal({
  isOpen,
  onClose,
  deal,
  onStorySaved,
}: AlignedStoryModalProps) {
  const [transcriptSource, setTranscriptSource] = useState<'fireflies' | 'paste'>('fireflies');
  const [firefliesTranscripts, setFirefliesTranscripts] = useState<any[]>([]);
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string>('');
  const [pastedTranscript, setPastedTranscript] = useState<string>('');
  const [loadingFireflies, setLoadingFireflies] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [story, setStory] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [savedToHubSpot, setSavedToHubSpot] = useState(false);
  const [isSavingToHubSpot, setIsSavingToHubSpot] = useState(false);

  // If deal already has an aligned story, load it directly!
  useEffect(() => {
    if (deal?.alignedStory) {
      setStory(deal.alignedStory);
    } else {
      setStory('');
    }
    setCopied(false);
    setSavedToHubSpot(false);
  }, [deal]);

  // Load Fireflies transcripts
  useEffect(() => {
    if (isOpen && transcriptSource === 'fireflies') {
      fetchFirefliesCalls();
    }
  }, [isOpen, transcriptSource]);

  const fetchFirefliesCalls = async () => {
    setLoadingFireflies(true);
    try {
      const res = await fetch('/api/fireflies/transcripts?limit=15');
      const data = await res.json();
      if (data.transcripts && data.transcripts.length > 0) {
        setFirefliesTranscripts(data.transcripts);
        
        // Auto-match if deal name matches transcript title
        if (deal) {
          const match = data.transcripts.find((t: any) =>
            t.title?.toLowerCase().includes(deal.name.toLowerCase().split(' ')[0])
          );
          if (match) setSelectedTranscriptId(match.id);
          else setSelectedTranscriptId(data.transcripts[0].id);
        } else {
          setSelectedTranscriptId(data.transcripts[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load Fireflies calls:', err);
    } finally {
      setLoadingFireflies(false);
    }
  };

  if (!isOpen || !deal) return null;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      let transcriptText = pastedTranscript;

      if (transcriptSource === 'fireflies' && selectedTranscriptId) {
        const res = await fetch(`/api/fireflies/transcripts?id=${selectedTranscriptId}`);
        const data = await res.json();
        if (data.transcript) {
          const sentences = data.transcript.sentences || [];
          transcriptText = sentences
            .map((s: any) => `${s.speaker_name || 'Speaker'}: ${s.text}`)
            .join('\n');
          if (!transcriptText) {
            transcriptText = data.transcript.summary?.overview || data.transcript.title || '';
          }
        }
      }

      const res = await fetch('/api/aligned/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          dealName: deal.name,
          clientName: deal.name.replace(/ - (Voila|Neuro|Helm|Deal)/gi, '').trim(),
          transcriptText,
          firefliesTranscriptId: selectedTranscriptId || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.story) {
        setStory(data.story);
        if (onStorySaved) onStorySaved(deal.id, data.story);
      }
    } catch (err) {
      console.error('Failed to generate Aligned story:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(story);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSaveToHubSpot = async () => {
    if (!deal || !story || isSavingToHubSpot) return;
    setIsSavingToHubSpot(true);
    try {
      const res = await fetch('/api/hubspot/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          noteBody: `📌 [ALIGNED DEAL ROOM STORY]\n\n${story}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedToHubSpot(true);
      }
    } catch (err) {
      console.error('Error saving story to HubSpot:', err);
    } finally {
      setIsSavingToHubSpot(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header (Light Theme) */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>Aligned Deal Room Story</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {deal.name}
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Turn your call into the 4-part executive story ready to paste into Aligned.so
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!story ? (
            /* Input / Generation Setup */
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <button
                  onClick={() => setTranscriptSource('fireflies')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    transcriptSource === 'fireflies'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Radio className="h-3.5 w-3.5" />
                  <span>Select from Fireflies.ai</span>
                </button>
                <button
                  onClick={() => setTranscriptSource('paste')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    transcriptSource === 'paste'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Paste Call Transcript</span>
                </button>
              </div>

              {transcriptSource === 'fireflies' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span className="font-semibold text-slate-700">My Recent Sales Calls (Ross Jermy)</span>
                    <button
                      onClick={fetchFirefliesCalls}
                      disabled={loadingFireflies}
                      className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
                    >
                      <RefreshCw className={`h-3 w-3 ${loadingFireflies ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {loadingFireflies ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium">
                      Loading your Fireflies transcripts...
                    </div>
                  ) : firefliesTranscripts.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-center font-medium">
                      No recent Fireflies transcripts found. Switch to &quot;Paste Call Transcript&quot;.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {firefliesTranscripts.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTranscriptId(t.id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                            selectedTranscriptId === t.id
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-medium shadow-2xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <p className="font-bold text-slate-900 truncate">{t.title}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {t.date ? new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} • {t.duration ? `${Math.round(t.duration / 60)} mins` : ''}
                            </p>
                          </div>
                          {selectedTranscriptId === t.id && (
                            <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Paste Transcript or Meeting Notes:
                  </label>
                  <textarea
                    rows={8}
                    value={pastedTranscript}
                    onChange={(e) => setPastedTranscript(e.target.value)}
                    placeholder="Paste the raw text of what was discussed, customer pain points voiced, and next steps..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating || (transcriptSource === 'paste' && !pastedTranscript.trim())}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-sm shadow-indigo-600/20 transition"
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Synthesizing Aligned Deal Story via Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Story for Aligned Room</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Output Preview & 1-Click Copy (Light Mode) */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-800">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span><strong>Story Ready!</strong> Formatted specifically for your Aligned Digital Sales Room.</span>
                </span>
                <button
                  onClick={() => setStory('')}
                  className="text-xs font-bold underline hover:text-emerald-950 transition"
                >
                  Regenerate
                </button>
              </div>

              {/* Story Output Display */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto select-all">
                {story}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm shadow-indigo-600/20 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-white" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy for Aligned Room</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSaveToHubSpot}
                    disabled={savedToHubSpot || isSavingToHubSpot}
                    className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 shadow-2xs transition"
                  >
                    {savedToHubSpot ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Logged to HubSpot</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5 text-blue-600" />
                        <span>{isSavingToHubSpot ? 'Saving...' : 'Save to HubSpot'}</span>
                      </>
                    )}
                  </button>
                </div>

                <a
                  href="https://app.aligned.so"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-1 text-slate-500 hover:text-slate-800 text-xs font-medium transition"
                >
                  <span>Open Aligned.so</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
