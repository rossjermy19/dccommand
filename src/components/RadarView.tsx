'use client';

import React from 'react';
import { Deal } from '@/lib/types';
import { 
  AlertTriangle, 
  ExternalLink, 
  Mail, 
  Sparkles, 
  Calendar, 
  PoundSterling,
  ChevronRight,
  Flame,
  CheckCircle2
} from 'lucide-react';

interface RadarViewProps {
  deals: Deal[];
  onSelectDealForAnalysis: (deal: Deal) => void;
  onDraftFollowUp: (deal: Deal) => void;
}

export function RadarView({ deals, onSelectDealForAnalysis, onDraftFollowUp }: RadarViewProps) {
  // Focus on deals needing attention (urgent or warning)
  const attentionDeals = deals.filter((d) => d.health === 'urgent' || d.health === 'warning');

  if (attentionDeals.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-10 text-center">
        <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-3">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-white">All Deals in Active Rhythm!</h3>
        <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
          Every active deal has had recent communication logged. No deals currently require urgent intervention.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Flame className="h-5 w-5 text-amber-400" />
            <span>High-Priority Deal Radar</span>
          </h2>
          <p className="text-xs text-slate-400">
            {attentionDeals.length} deals require your immediate engagement or post-call next steps.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attentionDeals.map((deal) => {
          const isUrgent = deal.health === 'urgent';
          const formattedAmount = deal.amount
            ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(deal.amount)
            : 'Unspecified';

          return (
            <div
              key={deal.id}
              className={`p-5 rounded-2xl border transition relative overflow-hidden group ${
                isUrgent
                  ? 'bg-gradient-to-b from-rose-950/20 to-slate-900 border-rose-900/50 hover:border-rose-700/80'
                  : 'bg-gradient-to-b from-amber-950/20 to-slate-900 border-amber-900/50 hover:border-amber-700/80'
              }`}
            >
              {/* Header: Deal Name & Amount */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition">
                    {deal.name}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {deal.stageLabel}
                    </span>
                    <span className="text-xs font-mono font-semibold text-emerald-400">
                      {formattedAmount}
                    </span>
                  </div>
                </div>

                <a
                  href={deal.hubspotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
                  title="Open in HubSpot"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              {/* Status Reason Banner */}
              <div
                className={`flex items-center space-x-2 text-xs font-medium px-3 py-2 rounded-lg my-3 ${
                  isUrgent
                    ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{deal.healthReason}</span>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400">
                  {deal.daysSinceContact !== null
                    ? `${deal.daysSinceContact}d since last touch`
                    : 'No touchpoint date'}
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onSelectDealForAnalysis(deal)}
                    className="flex items-center space-x-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg transition"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Analyze Call</span>
                  </button>

                  <button
                    onClick={() => onDraftFollowUp(deal)}
                    className="flex items-center space-x-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg shadow-sm shadow-blue-500/30 transition"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>Draft Email</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
