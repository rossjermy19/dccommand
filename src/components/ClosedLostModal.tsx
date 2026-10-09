'use client';

import React, { useState } from 'react';
import { Deal } from '@/lib/types';
import { X, AlertTriangle, Archive, Check } from 'lucide-react';

interface ClosedLostModalProps {
  isOpen: boolean;
  deal: Deal | null;
  onClose: () => void;
  onSuccess: () => void;
}

const COMMON_REASONS = [
  'No Response / Ghosted / Stalled',
  'Went with Competitor',
  'Pricing / Commercials Too High',
  'Bad Timing / Postponed to Later',
  'Feature Gap / Requirements Out of Scope',
  'Stayed with Existing Solution',
  'Poor Fit / Out of Target ICP',
  'Other',
];

export function ClosedLostModal({
  isOpen,
  deal,
  onClose,
  onSuccess,
}: ClosedLostModalProps) {
  if (!isOpen || !deal) return null;

  const [reason, setReason] = useState<string>(COMMON_REASONS[0]);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/hubspot/deal/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'closedlost',
          closedLostReason: reason,
          closedLostNotes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(`Error marking deal as Closed Lost: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-rose-50/50">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center">
              <Archive className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Mark Deal as Closed Lost</h2>
              <p className="text-xs text-slate-500">
                Updating <strong className="text-slate-800">{deal.name}</strong> in HubSpot
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              This will update the deal stage to <strong>Closed Lost</strong> in HubSpot and remove it from your active pipeline and daily board.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Closed Lost Reason <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              {COMMON_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Reason Details / Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Has not responded to recent follow-ups, operational project paused..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-sans leading-relaxed"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-rose-500/20 disabled:opacity-60"
            >
              <Archive className="h-4 w-4" />
              <span>{submitting ? 'Archiving Deal...' : 'Confirm Closed Lost'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
