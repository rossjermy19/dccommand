'use client';

import React, { useMemo } from 'react';
import { Deal } from '@/lib/types';
import { 
  Flame, 
  CalendarCheck,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { CompactDealCard } from './CompactDealCard';

interface RadarViewProps {
  deals: Deal[];
  activeFilter?: string;
  selectedTagFilter?: string;
  searchQuery?: string;
  onSelectDeal: (deal: Deal) => void;
  onSelectDealForAnalysis: (deal: Deal) => void;
  onDraftFollowUp: (deal: Deal) => void;
  onOpenAlignedModal?: (deal: Deal) => void;
  onTagUpdated?: () => void;
}

export function RadarView({ 
  deals, 
  activeFilter = 'all', 
  selectedTagFilter = 'ALL', 
  searchQuery = '', 
  onSelectDeal, 
  onSelectDealForAnalysis, 
  onDraftFollowUp,
  onOpenAlignedModal,
  onTagUpdated 
}: RadarViewProps) {
  // Apply Tag and Search filter
  const baseDeals = useMemo(() => {
    return deals.filter((d) => {
      // Dynamic Tag filter
      if (selectedTagFilter !== 'ALL') {
        const hasTag = d.tags?.includes(selectedTagFilter) || d.source === selectedTagFilter || d.subSource === selectedTagFilter;
        if (!hasTag) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = d.name.toLowerCase().includes(q);
        const matchStage = d.stageLabel.toLowerCase().includes(q);
        const matchTags = d.tags?.some((t) => t.toLowerCase().includes(q));
        const matchReason = d.healthReason.toLowerCase().includes(q);
        if (!matchName && !matchStage && !matchTags && !matchReason) return false;
      }

      return true;
    });
  }, [deals, selectedTagFilter, searchQuery]);

  const urgentDeals = useMemo(() => baseDeals.filter((d) => d.health === 'urgent'), [baseDeals]);
  const warningDeals = useMemo(() => baseDeals.filter((d) => d.health === 'warning'), [baseDeals]);
  const plannedDeals = useMemo(() => baseDeals.filter((d) => d.health === 'snoozed'), [baseDeals]);
  const healthyDeals = useMemo(() => baseDeals.filter((d) => d.health === 'healthy'), [baseDeals]);

  const showUrgent = activeFilter === 'all' || activeFilter === 'urgent';
  const showWarning = activeFilter === 'all' || activeFilter === 'warning';
  const showPlanned = activeFilter === 'all' || activeFilter === 'snoozed';
  const showHealthy = activeFilter === 'healthy';

  return (
    <div className="space-y-6">
      {/* 1. UNPLANNED STALLED (CRITICAL) */}
      {showUrgent && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-rose-200 pb-2">
            <h2 className="text-sm font-bold text-rose-800 flex items-center space-x-2 uppercase tracking-wider">
              <Flame className="h-4 w-4 text-rose-600" />
              <span>Unplanned Stalled Deals ({urgentDeals.length})</span>
            </h2>
            <span className="text-[11px] text-rose-600 font-medium">&gt; 7 days without contact and no scheduled task</span>
          </div>

          {urgentDeals.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500 shadow-2xs">
              No unplanned stalled deals!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {urgentDeals.map((deal) => (
                <CompactDealCard
                  key={deal.id}
                  deal={deal}
                  onSelectDeal={onSelectDeal}
                  onSelectDealForAnalysis={onSelectDealForAnalysis}
                  onDraftFollowUp={onDraftFollowUp}
                  onOpenAlignedModal={onOpenAlignedModal}
                  onTagUpdated={onTagUpdated}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. ACTION DUE */}
      {showWarning && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-amber-200 pb-2">
            <h2 className="text-sm font-bold text-amber-800 flex items-center space-x-2 uppercase tracking-wider">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>Action Due Today / Post-Meeting ({warningDeals.length})</span>
            </h2>
            <span className="text-[11px] text-amber-700 font-medium">Task due or next touch required</span>
          </div>

          {warningDeals.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500 shadow-2xs">
              No pending actions due right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {warningDeals.map((deal) => (
                <CompactDealCard
                  key={deal.id}
                  deal={deal}
                  onSelectDeal={onSelectDeal}
                  onSelectDealForAnalysis={onSelectDealForAnalysis}
                  onDraftFollowUp={onDraftFollowUp}
                  onOpenAlignedModal={onOpenAlignedModal}
                  onTagUpdated={onTagUpdated}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. PLANNED FOLLOW-UPS */}
      {showPlanned && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
            <h2 className="text-sm font-bold text-indigo-800 flex items-center space-x-2 uppercase tracking-wider">
              <CalendarCheck className="h-4 w-4 text-indigo-600" />
              <span>Planned Follow-ups ({plannedDeals.length})</span>
            </h2>
            <span className="text-[11px] text-indigo-600 font-medium">Under control with scheduled HubSpot tasks</span>
          </div>

          {plannedDeals.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500 shadow-2xs">
              No planned follow-up tasks currently scheduled.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {plannedDeals.map((deal) => (
                <CompactDealCard
                  key={deal.id}
                  deal={deal}
                  onSelectDeal={onSelectDeal}
                  onSelectDealForAnalysis={onSelectDealForAnalysis}
                  onDraftFollowUp={onDraftFollowUp}
                  onOpenAlignedModal={onOpenAlignedModal}
                  onTagUpdated={onTagUpdated}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. IN MOMENTUM */}
      {showHealthy && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
            <h2 className="text-sm font-bold text-emerald-800 flex items-center space-x-2 uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>In Momentum ({healthyDeals.length})</span>
            </h2>
            <span className="text-[11px] text-emerald-600 font-medium">Contacted within 3 days or today</span>
          </div>

          {healthyDeals.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500 shadow-2xs">
              No deals touched in the last 3 days.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {healthyDeals.map((deal) => (
                <CompactDealCard
                  key={deal.id}
                  deal={deal}
                  onSelectDeal={onSelectDeal}
                  onSelectDealForAnalysis={onSelectDealForAnalysis}
                  onDraftFollowUp={onDraftFollowUp}
                  onOpenAlignedModal={onOpenAlignedModal}
                  onTagUpdated={onTagUpdated}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
