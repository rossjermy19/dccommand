'use client';

import React from 'react';
import { Deal } from '@/lib/types';
import { 
  AlertTriangle, 
  ExternalLink, 
  Mail, 
  Sparkles, 
  Calendar, 
  CalendarCheck,
  ChevronRight,
  Flame,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface RadarViewProps {
  deals: Deal[];
  onSelectDeal: (deal: Deal) => void;
  onSelectDealForAnalysis: (deal: Deal) => void;
  onDraftFollowUp: (deal: Deal) => void;
}

export function RadarView({ deals, onSelectDeal, onSelectDealForAnalysis, onDraftFollowUp }: RadarViewProps) {
  const attentionDeals = deals.filter((d) => d.health === 'urgent' || d.health === 'warning');
  const plannedDeals = deals.filter((d) => d.health === 'snoozed');

  return (
    <div className="space-y-8">
      {/* 1. ATTENTION REQUIRED (UNPLANNED / POST-MEETING) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Flame className="h-5 w-5 text-amber-400" />
              <span>Action Required Radar</span>
            </h2>
            <p className="text-xs text-slate-400">
              {attentionDeals.length} deals require touchpoints or post-meeting deliverables (no future task scheduled).
            </p>
          </div>
        </div>

        {attentionDeals.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-2">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">No Unplanned Ghosting Risks!</h3>
            <p className="text-slate-400 text-xs mt-1">
              All deals either have recent communication or a planned follow-up task scheduled.
            </p>
          </div>
        ) : (
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
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div onClick={() => onSelectDeal(deal)} className="cursor-pointer">
                      <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition flex items-center space-x-1.5">
                        <span>{deal.name}</span>
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition text-blue-400" />
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

                  <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-400">
                      {deal.daysSinceContact !== null
                        ? deal.daysSinceContact === 0
                          ? 'Touched today'
                          : deal.daysSinceContact === 1
                          ? 'Touched yesterday'
                          : `${deal.daysSinceContact}d since last touch`
                        : 'No touchpoint date'}
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onSelectDeal(deal)}
                        className="text-xs font-medium text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition"
                      >
                        Notes & Tasks
                      </button>
                      <button
                        onClick={() => onSelectDealForAnalysis(deal)}
                        className="flex items-center space-x-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg transition"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Analyze</span>
                      </button>
                      <button
                        onClick={() => onDraftFollowUp(deal)}
                        className="flex items-center space-x-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg shadow-sm shadow-blue-500/30 transition"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>Email</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. PLANNED FOLLOW-UPS & SCHEDULED RE-ENGAGEMENTS */}
      {plannedDeals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <CalendarCheck className="h-5 w-5 text-indigo-400" />
                <span>Planned Follow-ups & Re-engagements</span>
              </h2>
              <p className="text-xs text-slate-400">
                {plannedDeals.length} deals have scheduled next steps or deferred re-engagement (Dealt with / On track).
              </p>
            </div>
            <span className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-full font-medium">
              Scheduled in HubSpot
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plannedDeals.map((deal) => {
              const formattedAmount = deal.amount
                ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(deal.amount)
                : 'Unspecified';

              return (
                <div
                  key={deal.id}
                  className="p-5 rounded-2xl border border-indigo-900/40 bg-gradient-to-b from-indigo-950/20 to-slate-900 hover:border-indigo-700/60 transition group"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div onClick={() => onSelectDeal(deal)} className="cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition flex items-center space-x-1.5">
                          <span>{deal.name}</span>
                          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition text-blue-400" />
                        </h3>
                      </div>
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

                  {/* Planned Follow-up Banner */}
                  <div className="flex items-start space-x-2 text-xs font-medium px-3 py-2.5 rounded-lg my-3 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    <CalendarCheck className="h-4 w-4 flex-shrink-0 text-indigo-400 mt-0.5" />
                    <div className="leading-relaxed">
                      <span>{deal.healthReason}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                    <span className="text-[11px] text-indigo-400/90 font-medium flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>On Track / Scheduled</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onSelectDeal(deal)}
                        className="text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg transition"
                      >
                        View Notes & Tasks
                      </button>
                      <button
                        onClick={() => onSelectDealForAnalysis(deal)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition"
                        title="Analyze Call"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
