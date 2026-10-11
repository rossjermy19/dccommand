'use client';

import React, { useState, useEffect } from 'react';
import { Deal } from '@/lib/types';
import { 
  ExternalLink, 
  Presentation,
  Bot,
  Mail, 
  Clock, 
  CheckCircle2, 
  CalendarCheck,
  FileText,
  Star
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
  const [isGold, setIsGold] = useState(!!deal.isGold);
  const [isTogglingGold, setIsTogglingGold] = useState(false);

  useEffect(() => {
    setIsGold(!!deal.isGold);
  }, [deal.isGold]);

  const handleToggleGold = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTogglingGold) return;

    const nextGold = !isGold;
    setIsGold(nextGold);
    setIsTogglingGold(true);

    try {
      const res = await fetch(`/api/hubspot/deal/${deal.id}/gold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isGold: nextGold, dealName: deal.name }),
      });
      const data = await res.json();
      if (!data.success) {
        setIsGold(!nextGold); // rollback
      } else {
        if (onTagUpdated) onTagUpdated();
      }
    } catch (err) {
      setIsGold(!nextGold); // rollback
    } finally {
      setIsTogglingGold(false);
    }
  };

  const formattedAmount = deal.amount
    ? new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        maximumFractionDigits: 0,
      }).format(deal.amount)
    : '£—';

  // Health Pill styling (Light Theme)
  const getHealthBadge = () => {
    if (deal.isBackWithLibertyJ) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-300">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse"></span>
          <span>With Liberty J ({deal.daysWithLibertyJ || 0}d)</span>
        </span>
      );
    }

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
      className={`group relative border shadow-2xs hover:shadow-md rounded-xl p-3 sm:p-3.5 transition flex flex-col justify-between cursor-pointer space-y-2.5 ${
        isGold
          ? 'border-amber-400 bg-gradient-to-br from-amber-50/95 via-yellow-50/70 to-amber-100/60 ring-2 ring-amber-400/60 shadow-md shadow-amber-500/20 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/30'
          : deal.isBackWithLibertyJ
          ? 'bg-white hover:bg-slate-50/50 border-teal-300 hover:border-teal-400 ring-1 ring-teal-200/50'
          : 'bg-white hover:bg-slate-50/50 border-slate-200/90 hover:border-slate-300'
      }`}
    >
      {/* Top Banner if Gold (High Chance to go ahead) */}
      {isGold && (
        <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-amber-950 -mx-3 sm:-mx-3.5 -mt-3 sm:-mt-3.5 px-3 py-1.5 rounded-t-xl border-b border-amber-400/80 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-1.5 font-black text-[10.5px] uppercase tracking-wider">
            <Star className="h-3.5 w-3.5 fill-amber-950 text-amber-950" />
            <span>High Chance to Go Ahead</span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider bg-amber-950/15 text-amber-950 px-1.5 py-0.5 rounded border border-amber-950/20">
            Gold Deal
          </span>
        </div>
      )}

      {/* Top Banner if Back with Liberty J (only if not already Gold) */}
      {!isGold && deal.isBackWithLibertyJ && (
        <div className="bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-teal-500/5 -mx-3 sm:-mx-3.5 -mt-3 sm:-mt-3.5 px-3 py-1.5 rounded-t-xl border-b border-teal-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <div className="h-4 w-7 bg-white rounded border border-teal-200 p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
              <img src="/liberty-jai-logo.jpg" alt="Liberty Jai" className="h-full w-full object-contain" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-900">
              Back with Liberty J
            </span>
          </div>
          <span className="text-[9.5px] font-bold text-teal-700 bg-teal-100/90 px-1.5 py-0.5 rounded">
            Partner Action
          </span>
        </div>
      )}

      {/* Top Header: Title & HubSpot link & Gold Star toggle */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-1.5 min-w-0 flex-1">
            {deal.isLibertyJ && !deal.isBackWithLibertyJ && (
              <div className="h-3.5 w-6 bg-white rounded border border-indigo-200 p-0.5 flex items-center justify-center shrink-0" title="Sourced by Liberty J">
                <img src="/liberty-jai-logo.jpg" alt="Liberty Jai" className="h-full w-full object-contain" />
              </div>
            )}
            <h4
              className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition truncate leading-snug flex-1"
              title={deal.name}
            >
              {deal.name}
            </h4>
          </div>
          <div className="flex items-center space-x-0.5 -mr-1 shrink-0">
            <button
              type="button"
              onClick={handleToggleGold}
              disabled={isTogglingGold}
              title={isGold ? 'Gold VIP (High Chance to Close) — Click to remove' : 'Mark as Gold VIP (High Chance to Close)'}
              className={`p-1 rounded-md transition ${
                isGold
                  ? 'text-amber-600 bg-amber-100 hover:bg-amber-200'
                  : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${isGold ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>
            <a
              href={deal.hubspotUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Open in HubSpot CRM"
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded hover:bg-slate-100 transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Amount & Status Pill Row */}
        <div className="flex items-center justify-between gap-2 mt-1.5">
          <span className={`text-xs sm:text-sm font-bold font-mono px-1.5 py-0.5 rounded tracking-tight ${
            isGold
              ? 'text-amber-950 bg-amber-200/90 border border-amber-400 font-extrabold shadow-2xs'
              : 'text-emerald-800 bg-emerald-50 border border-emerald-200/60'
          }`}>
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
              title="Aligned Deal Room Story (Pitch & Deck)"
              className="p-1 rounded hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition"
            >
              <Presentation className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectDeal(deal);
            }}
            title="View Deal Notes, History & Timeline"
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition"
          >
            <FileText className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectDealForAnalysis(deal);
            }}
            title="Fireflies AI Meeting Intelligence"
            className="p-1 rounded hover:bg-purple-50 text-slate-400 hover:text-purple-600 transition"
          >
            <Bot className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDraftFollowUp(deal);
            }}
            title="Draft Follow-up Email"
            className="p-1 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"
          >
            <Mail className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
