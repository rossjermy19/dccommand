'use client';

import React, { useState, useEffect } from 'react';
import { Deal, TranscriptAnalysisResult } from '@/lib/types';
import { 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  UploadCloud, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  FileText,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface TranscriptIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  deals: Deal[];
  preselectedDeal: Deal | null;
}

export function TranscriptIntelligenceModal({
  isOpen,
  onClose,
  deals,
  preselectedDeal,
}: TranscriptIntelligenceModalProps) {
  const [selectedDealId, setSelectedDealId] = useState<string>('');
  const [transcriptText, setTranscriptText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<TranscriptAnalysisResult | null>(null);
  const [isLoggingToHubspot, setIsLoggingToHubspot] = useState(false);
  const [hubspotLogSuccess, setHubspotLogSuccess] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedDeal) {
      setSelectedDealId(preselectedDeal.id);
    } else if (deals.length > 0 && !selectedDealId) {
      setSelectedDealId(deals[0].id);
    }
  }, [preselectedDeal, deals]);

  if (!isOpen) return null;

  const currentDeal = deals.find((d) => d.id === selectedDealId);

  const handleAnalyze = async () => {
    if (!transcriptText.trim()) {
      setError('Please enter or paste a meeting transcript.');
      return;
    }
    setError(null);
    setIsAnalyzing(true);
    setHubspotLogSuccess(false);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcriptText,
          dealName: currentDeal?.name,
          dealStage: currentDeal?.stageLabel,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to analyze transcript');

      setAnalysisResult(data.analysis);
    } catch (err: any) {
      setError(err.message || 'An error occurred during transcript analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogToHubspot = async () => {
    if (!analysisResult || !selectedDealId) return;

    setIsLoggingToHubspot(true);
    try {
      const noteBody = `
<h3>🤖 Fireflies AI Meeting Intelligence (DC Command Centre)</h3>
<p><strong>Executive Summary:</strong> ${analysisResult.summary}</p>
<p><strong>Urgency Score:</strong> ${analysisResult.urgencyScore}/100 (${analysisResult.dealHealth.toUpperCase()})</p>

<h4>Key Despatch Cloud Fit:</h4>
<ul>
  ${analysisResult.despatchCloudFit.map((f) => `<li>${f}</li>`).join('')}
</ul>

<h4>Commitments by Ross:</h4>
<ul>
  ${analysisResult.commitmentsMade.byRoss.map((c) => `<li>${c}</li>`).join('')}
</ul>

<h4>Commitments by Client:</h4>
<ul>
  ${analysisResult.commitmentsMade.byClient.map((c) => `<li>${c}</li>`).join('')}
</ul>

<h4>Recommended Next Step:</h4>
<p>${analysisResult.recommendedNextAction}</p>
      `.trim();

      const res = await fetch('/api/hubspot/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: selectedDealId,
          noteBody,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setHubspotLogSuccess(true);
    } catch (err: any) {
      alert(`Could not log note to HubSpot: ${err.message}`);
    } finally {
      setIsLoggingToHubspot(false);
    }
  };

  const handleCopyEmail = () => {
    if (!analysisResult) return;
    const text = `Subject: ${analysisResult.suggestedFollowUpEmail.subject}\n\n${analysisResult.suggestedFollowUpEmail.body}`;
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Call Intelligence & Action Extractor</h2>
              <p className="text-xs text-slate-400">
                Extract commitments, objections, and next steps from Fireflies or call notes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Deal Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Target Deal in Pipeline
            </label>
            <select
              value={selectedDealId}
              onChange={(e) => setSelectedDealId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.amount ? `(£${d.amount})` : ''} — {d.stageLabel}
                </option>
              ))}
            </select>
          </div>

          {/* Transcript Input */}
          {!analysisResult && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Paste Fireflies / Call Transcript
                </label>
                <span className="text-xs text-slate-500">Supports text, VTT, or call summary</span>
              </div>
              <textarea
                rows={8}
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                placeholder="Paste the meeting transcript here... e.g.:&#10;Ross: Hi Mike, thanks for jumping on. How are things running with your current warehouse setup?&#10;Mike: We're doing about 2,000 orders a day and our current system keeps failing to sync with Royal Mail..."
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
              />

              {error && (
                <div className="mt-2 text-xs text-rose-400 flex items-center space-x-1.5">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-lg shadow-blue-500/25 disabled:opacity-50"
                >
                  <Sparkles className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>{isAnalyzing ? 'Analyzing with Intelligence Engine...' : 'Run Intelligence Analysis'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Analysis Results Display */}
          {analysisResult && (
            <div className="space-y-5 animate-in fade-in-50">
              {/* Executive Recap & Urgency */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                    Executive Summary
                  </span>
                  <p className="text-sm text-slate-200 mt-1 leading-relaxed">
                    {analysisResult.summary}
                  </p>
                </div>
                <div className="flex-shrink-0 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center min-w-[130px]">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Urgency Score</span>
                  <div className="text-2xl font-black text-cyan-400">{analysisResult.urgencyScore}/100</div>
                  <span className="text-[11px] font-medium text-emerald-400 uppercase">
                    {analysisResult.dealHealth}
                  </span>
                </div>
              </div>

              {/* Commitments & Next Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ross's Commitments */}
                <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2 flex items-center space-x-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Deliverables Ross Promised</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {analysisResult.commitmentsMade.byRoss.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span className="text-blue-400">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Client's Commitments */}
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center space-x-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Client Next Steps</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {analysisResult.commitmentsMade.byClient.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span className="text-emerald-400">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* DC Fit & Objections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Despatch Cloud Fit Points
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.despatchCloudFit.map((fit, idx) => (
                      <span key={idx} className="text-xs px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {fit}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                    Hesitations / Objections
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {analysisResult.objections.map((obj, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span className="text-amber-400">•</span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pre-drafted Follow-up Email */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                    <FileText className="h-4 w-4 text-blue-400" />
                    <span>Pre-drafted Follow-up Email</span>
                  </span>
                  <button
                    onClick={handleCopyEmail}
                    className="flex items-center space-x-1 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 transition"
                  >
                    {copiedEmail ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedEmail ? 'Copied to Clipboard!' : 'Copy Email'}</span>
                  </button>
                </div>
                <div className="text-xs font-semibold text-slate-300">
                  Subject: {analysisResult.suggestedFollowUpEmail.subject}
                </div>
                <div className="p-3 bg-slate-950 rounded-lg text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed border border-slate-800/80">
                  {analysisResult.suggestedFollowUpEmail.body}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
                <button
                  onClick={() => {
                    setAnalysisResult(null);
                    setTranscriptText('');
                  }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ← Analyze Another Meeting
                </button>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    onClick={handleLogToHubspot}
                    disabled={isLoggingToHubspot || hubspotLogSuccess}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-lg shadow-emerald-500/20 disabled:opacity-70"
                  >
                    {hubspotLogSuccess ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-white" />
                        <span>Logged to HubSpot Deal!</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>{isLoggingToHubspot ? 'Logging...' : 'Log Summary to HubSpot'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
