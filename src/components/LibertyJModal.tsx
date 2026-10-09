'use client';

import React, { useState } from 'react';
import { Deal } from '@/lib/types';
import { X, Send, Sparkles, CheckCircle2, RotateCcw, Zap } from 'lucide-react';

interface LibertyJModalProps {
  isOpen: boolean;
  deal: Deal | null;
  mode?: 'push' | 'kick' | 'recall';
  onClose: () => void;
  onSuccess: () => void;
}

export function LibertyJModal({
  isOpen,
  deal,
  mode = 'push',
  onClose,
  onSuccess,
}: LibertyJModalProps) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !deal) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/hubspot/deal/${deal.id}/liberty-j`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode,
          dealName: deal.name,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update Liberty J status');
      }

      setNotes('');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-auto animate-in zoom-in-95 duration-150">
        {/* Modal Header with Liberty J Brand Banner */}
        <div className="p-5 border-b border-teal-100 bg-gradient-to-r from-teal-50 via-emerald-50 to-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-16 bg-white border border-teal-200 rounded-lg p-1 flex items-center justify-center shadow-2xs overflow-hidden">
              <img
                src="/liberty-jai-logo.jpg"
                alt="Liberty Jai"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {mode === 'push'
                  ? 'Hand Deal Back to Liberty J'
                  : mode === 'kick'
                  ? 'Give Liberty J a Kick'
                  : 'Recall Deal to My Desk'}
              </h3>
              <p className="text-xs text-teal-800 font-semibold truncate max-w-xs mt-0.5">
                {deal.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          {mode === 'push' && (
            <div className="space-y-3">
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-teal-900 leading-relaxed">
                <p className="font-semibold mb-1">🎯 Action Shifts to Partner</p>
                <p className="text-slate-600">
                  This deal will be marked as <strong>Back with Liberty J</strong>. We will log a formal note in HubSpot CRM stating that Liberty J have the action to chase up and re-engage the prospect for you.
                </p>
                <p className="text-slate-600 mt-1">
                  It will be cleared from your daily active desk so you aren't hassled on it, and will sit in your dedicated <strong>Liberty J Queue</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Instructions or Context for Liberty J (Optional):
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Re-reach out to prospect next week; they wanted pricing review after board meeting..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          {mode === 'kick' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 leading-relaxed">
                <p className="font-semibold mb-1">⚡ Chase Partner Progress</p>
                <p className="text-slate-600">
                  Log that you contacted or chased Liberty J on this account. This records a timeline activity in HubSpot CRM and updates the chase counter.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chase Notes (Optional):
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Sent message to Liberty J team asking for update on prospect re-engagement..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          {mode === 'recall' && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 leading-relaxed">
              <p className="font-semibold mb-1">📥 Bring Back to My Desk</p>
              <p className="text-slate-600">
                This removes the <strong>Back with Liberty J</strong> tag and brings the deal back onto your primary active rhythm and desk for direct follow-up.
              </p>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition shadow-sm ${
                mode === 'push'
                  ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-500/20'
                  : mode === 'kick'
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              {submitting ? (
                <span>Updating...</span>
              ) : mode === 'push' ? (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Hand to Liberty J & Log Note</span>
                </>
              ) : mode === 'kick' ? (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  <span>Log Kick in HubSpot</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Recall to My Desk</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
