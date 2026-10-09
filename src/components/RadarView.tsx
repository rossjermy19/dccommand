'use client';

import React, { useMemo } from 'react';
import { Deal } from '@/lib/types';
import { 
  Flame, 
  CalendarCheck,
  CheckCircle2,
  Clock,
  Sparkles,
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
  onTagUpdated 
}: RadarViewProps) {
  // Apply Tag and Search filter
  const baseDeals = useMemo(() => {
    return deals.filter((d) => {
      // Tag filter
      if (selectedTagFilter !== 'ALL') {
        const isLibbyFilter = selectedTagFilter === 'Libby';
        if (isLibbyFilter) {
          const hasLibby = d.tags?.some((t) => /libby|liberty/i.test(t)) || /libby|liberty/i.test(d.subSource || '');
          if (!hasLibby) return false;
        } else {
          const hasTag = d.tags?.includes(selectedTagFilter) || d.source === selectedTagFilter || d.subSource === selectedTagFilter;
          if (!hasTag) return false;
        }
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

  // Section 1: Urgent / Stalled
  const urgentDeals = useMemo(() => {
    return baseDeals.filter((d) => d.health === 'urgent');
  }, [baseDeals]);

  // Section 2: Action Due / Warning
  const warningDeals = useMemo(() => {
    return baseDeals.filter((d) => d.health === 'warning');
  }, [baseDeals]);

  // Section 3: Planned Follow-ups
  const plannedDeals = useMemo(() => {
    return baseDeals.filter((d) => d.health === 'snoozed');
  }, [baseDeals]);

  // Section 4: In Momentum
  const healthyDeals = useMemo(() => {
    return baseDeals.filter((d) => d.health === 'healthy');
  }, [baseDeals]);

  // Check if we should only show a specific section due to activeFilter
  const showUrgent = activeFilter === 'all' || activeFilter === 'urgent';
  const showWarning = activeFilter === 'all' || activeFilter === 'warning';
  const showPlanned = activeFilter === 'all' || activeFilter === 'snoozed';
  const showHealthy = activeFilter === 'healthy';

  return (
    <div className="space-y-6">
      {/* 1. UNPLANNED STALLED (CRITICAL) */}
      {showUrgent && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-rose-950/40 pb-2">
            <h2 className="text-sm font-bold text-rose-300 flex items-center space-x-2 uppercase tracking-wider">
              <Flame className="h-4 w-4 text-rose-400" />
              <span>Unplanned Stalled Deals ({urgentDeals.length})</span>
            </h2>
            <span className="text-[11px] text-rose-400/80 font-medium">&gt; 7 days without contact and no scheduled task</span>
          </div>

          {urgentDeals.length === 0 ? (
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-4 text-center text-xs text-slate-500">
              No unplanned stalled deals!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {urgentDeals.map((deal) => (
                <CompactDealCard
                  key={deal.id}
                  deal={deal}
                  onSelectDeal={onSelectDeal}
                  onSelectDealForAnalysis={onSelectDealForAnalysis}
                  onDraftFollowUp={onDraftFollowUp}
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
          <div className="flex items-center justify-between border-b border-amber-950/40 pb-2">
            <h2 className="text-sm font-bold text-amber-300 flex items-center space-x-2 uppercase tracking-wider">
              <Clock className="h-4 w-4 text-amber-400" />
              <span>Action Due Today / Post-Meeting ({warningDeals.length})</span>
            </h2>
            <span className="text-[11px] text-amber-400/80 font-medium">Task due or next touch required</span>
          </div>

          {warningDeals.length === 0 ? (
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-4 text-center text-xs text-slate-500">
              No pending actions due right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {warningDeals.map((deal) => (
                <CompactDealCard
                  key={deal.id}
                  deal={deal}
                  onSelectDeal={onSelectDeal}
                  onSelectDealForAnalysis={onSelectDealForAnalysis}
                  onDraftFollowUp={onDraftFollowUp}
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
          <div className="flex items-center justify-between border-b border-indigo-950/40 pb-2">
            <h2 className="text-sm font-bold text-indigo-300 flex items-center space-x-2 uppercase tracking-wider">
              <CalendarCheck className="h-4 w-4 text-indigo-400" />
              <span>Planned Follow-ups ({plannedDeals.length})</span>
            </h2>
            <span className="text-[11px] text-indigo-400/80 font-medium">Under control with scheduled HubSpot tasks</span>
          </div>

          {plannedDeals.length === 0 ? (
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-4 text-center text-xs text-slate-500">
              No planned follow-up tasks currently scheduled.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {plannedDeals.map((deal) => (
                <CompactDealCard
                  key={deal.id}
                  deal={deal}
                  onSelectDeal={onSelectDeal}
                  onSelectDealForAnalysis={onSelectDealForAnalysis}
                  onDraftFollowUp={onDraftFollowUp}
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
          <div className="flex items-center justify-between border-b border-emerald-950/40 pb-2">
            <h2 className="text-sm font-bold text-emerald-300 flex items-center space-x-2 uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>In Momentum ({healthyDeals.length})</span>
            </h2>
            <span className="text-[11px] text-emerald-400/80 font-medium">Contacted within 3 days or today</span>
          </div>

          {healthyDeals.length === 0 ? (
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-4 text-center text-xs text-slate-500">
              No deals touched in the last 3 days.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {healthyDeals.map((deal) => (
                <CompactDealCard
                  key={deal.id}
                  deal={deal}
                  onSelectDeal={onSelectDeal}
                  onSelectDealForAnalysis={onSelectDealForAnalysis}
                  onDraftFollowUp={onDraftFollowUp}
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
