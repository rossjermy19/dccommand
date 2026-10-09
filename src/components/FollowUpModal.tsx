'use client';

import React, { useState } from 'react';
import { Deal } from '@/lib/types';
import { X, Mail, Copy, Check, Sparkles, Send } from 'lucide-react';

interface FollowUpModalProps {
  deal: Deal | null;
  onClose: () => void;
  onLogNote: (dealId: string, note: string) => Promise<void>;
}

export function FollowUpModal({ deal, onClose, onLogNote }: FollowUpModalProps) {
  if (!deal) return null;

  const [copied, setCopied] = useState(false);
  const [logging, setLogging] = useState(false);
  const [logged, setLogged] = useState(false);

  const prospectName = deal.name.split('-')[0].trim();
  
  // Smart dynamic follow up template tailored for Despatch Cloud
  const isPostMeeting = deal.stage === 'presentationscheduled' || deal.stage === '1209215206';
  const defaultSubject = isPostMeeting
    ? `Despatch Cloud - Following up on our discussion (${prospectName})`
    : `Checking in - Despatch Cloud & ${prospectName}`;

  const defaultBody = isPostMeeting
    ? `Hi ${prospectName} team,\n\nI wanted to follow up following our recent discussion regarding your shipping and fulfillment operations.\n\nHave you had the opportunity to review the points we covered around Despatch Cloud's integration capabilities?\n\nHappy to jump on a quick 10-minute touchpoint this week to answer any questions or share the commercial proposal.\n\nBest regards,\nRoss Jermy\nDespatch Cloud`
    : `Hi ${prospectName} team,\n\nI hope you're having a productive week.\n\nI'm following up on our active thread regarding Despatch Cloud. Given your current order volumes and carrier setup, I wanted to check whether you've had a chance to evaluate the next steps for your operations.\n\nLet me know what day works best for a brief catch-up.\n\nBest regards,\nRoss Jermy\nDespatch Cloud`;

  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveToHubspot = async () => {
    setLogging(true);
    try {
      await onLogNote(
        deal.id,
        `<p><strong>Generated Follow-up Draft:</strong></p><p><strong>Subject:</strong> ${subject}</p><p>${body.replace(/\n/g, '<br/>')}</p>`
      );
      setLogged(true);
    } catch (e) {
      alert('Failed to log note to HubSpot.');
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Draft Follow-up Email</h2>
              <p className="text-xs text-slate-500">
                Tailored for <strong className="text-slate-700">{deal.name}</strong> ({deal.stageLabel})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Email Body
            </label>
            <textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 font-sans leading-relaxed"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              onClick={handleSaveToHubspot}
              disabled={logging || logged}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 transition disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5 text-blue-600" />
              <span>{logged ? 'Saved as HubSpot Note' : logging ? 'Saving...' : 'Save Draft to Deal'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-md shadow-blue-500/20"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-200" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy to Send in Outlook / HubSpot'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
