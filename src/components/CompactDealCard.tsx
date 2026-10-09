'use client';

import React from 'react';
import { Deal } from '@/lib/types';
import { 
  ExternalLink, 
  Sparkles, 
  Mail, 
  Clock, 
  CheckCircle2, 
  CalendarCheck,
  FileText
} from 'lucide-react';
import { DealTagBadge } from './DealTagBadge';

interface CompactDealCardProps {
  deal: Deal;
  onSelectDeal: (deal: Deal) => void;
  onSelectDealForAnalysis: (deal: Deal) => void;
  onDraftFollowUp: (deal: Deal) => void;
  onOpenAlignedModal?: (deal: Deal) => void;
  onTagUpdated?: () => void;
}

export function CompactDealCard({
  deal,
  onSelectDeal,
  onSelectDealForAnalysis,
  onDraftFollowUp,
  onOpenAlignedModal,
  onTagUpdated,
}: CompactDealCardProps) {
  const formattedAmount = deal.amount
    ? new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        maximumFractionDigits: 0,
      }).format(deal.amount)
    : '£—';

  // Health Pill styling (Light Theme)
  const getHealthBadge = () => {
    switch (deal.health) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span>Stalled {deal.daysSinceContact ? `${deal.daysSinceContact}d` : ''}</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="h-2.5 w-2.5 text-amber-600" />
            <span>Action Due</span>
          </span>
        );
      case 'snoozed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <CalendarCheck className="h-2.5 w-2.5 text-indigo-600" />
            <span>Planned</span>
          </span>
        );
      case 'healthy':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
            <span>{deal.daysSinceContact === 0 ? 'Today' : 'In Rhythm'}</span>
          </span>
        );
    }
  };

  return (
    <div
      onClick={() => onSelectDeal(deal)}
      className="group relative bg-white hover:bg-slate-50/50 border border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-md rounded-xl p-3 sm:p-3.5 transition flex flex-col justify-between cursor-pointer space-y-2.5"
    >
      {/* Top Header: Title & HubSpot link */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h4
            className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition truncate leading-snug flex-1"
            title={deal.name}
          >
            {deal.name}
          </h4>
          <a
            href={deal.hubspotUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Open in HubSpot CRM"
            className="text-slate-400 hover:text-slate-700 p-0.5 rounded hover:bg-slate-100 transition -mr-1"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Amount & Status Pill Row */}
        <div className="flex items-center justify-between gap-2 mt-1.5">
          <span className="text-xs sm:text-sm font-bold font-mono text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded tracking-tight">
            {formattedAmount}
          </span>
          {getHealthBadge()}
        </div>
      </div>

      {/* Tags / Origin Row */}
      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
        <DealTagBadge
          dealId={deal.id}
          tags={deal.tags}
          subSource={deal.subSource}
          onTagUpdated={onTagUpdated}
        />
        
        {/* Days since contact */}
        <span className="text-[10px] text-slate-500 font-medium shrink-0">
          {deal.daysSinceContact === 0 ? (
            <span className="text-emerald-700 font-bold">Today</span>
          ) : deal.daysSinceContact !== null ? (
            `${deal.daysSinceContact}d ago`
          ) : (
            'No touch'
          )}
        </span>
      </div>

      {/* Context 1-liner */}
      <p className="text-[10.5px] text-slate-600 line-clamp-1 italic bg-slate-50 px-2 py-1 rounded border border-slate-200/60">
        {deal.healthReason}
      </p>

      {/* Action Toolbar on bottom */}
      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
        <span className="text-[10px] text-slate-600 truncate max-w-[120px] font-medium">
          {deal.stageLabel}
        </span>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
          {onOpenAlignedModal && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenAlignedModal(deal);
              }}
              title="Generate / View Aligned Deal Room Story"
              className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectDeal(deal);
            }}
            title="View Notes, Emails & Tasks"
            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
          >
            <FileText className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectDealForAnalysis(deal);
            }}
            title="Fireflies AI Meeting Insights"
            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-amber-600 transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDraftFollowUp(deal);
            }}
            title="Draft Follow-up Email"
            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition"
          >
            <Mail className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
