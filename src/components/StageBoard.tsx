'use client';

import React, { useMemo } from 'react';
import { Deal } from '@/lib/types';
import { CompactDealCard } from './CompactDealCard';
import { Search, Tag, Filter, Layers } from 'lucide-react';

interface StageBoardProps {
  deals: Deal[];
  activeFilter: string;
  selectedTagFilter: string;
  searchQuery: string;
  onSelectDeal: (deal: Deal) => void;
  onSelectDealForAnalysis: (deal: Deal) => void;
  onDraftFollowUp: (deal: Deal) => void;
  onOpenAlignedModal?: (deal: Deal) => void;
  onTagUpdated?: () => void;
}

// Stage ordering preference for standard sales flow
const STAGE_ORDER_HINTS: Record<string, number> = {
  'Meeting Booked': 10,
  'Meeting Held': 20,
  'Qualified To Buy': 30,
  'Contact Made': 35,
  'Upside': 40,
  'Proposal / Active Review': 45,
  'Expected to close': 50,
  'Committed': 60,
  'Contract Sent': 70,
  'Evaluation / Follow-up': 80,
  'No Response': 85,
  'Back Burner': 90,
  'Back Burning': 92,
  'Re-Engage Pipeline': 95,
};

function getStageSortWeight(stageLabel: string): number {
  for (const [key, weight] of Object.entries(STAGE_ORDER_HINTS)) {
    if (stageLabel.toLowerCase().includes(key.toLowerCase())) {
      return weight;
    }
  }
  return 50;
}

export function StageBoard({
  deals,
  activeFilter,
  selectedTagFilter,
  searchQuery,
  onSelectDeal,
  onSelectDealForAnalysis,
  onDraftFollowUp,
  onOpenAlignedModal,
  onTagUpdated,
}: StageBoardProps) {
  // 1. Filter deals by KPI health status, Tag, and Search text
  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      // KPI filter
      if (activeFilter === 'urgent' && d.health !== 'urgent') return false;
      if (activeFilter === 'warning' && d.health !== 'warning') return false;
      if (activeFilter === 'snoozed' && d.health !== 'snoozed') return false;
      if (activeFilter === 'healthy' && d.health !== 'healthy') return false;

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
  }, [deals, activeFilter, selectedTagFilter, searchQuery]);

  // 2. Group deals into stages
  const stageColumns = useMemo(() => {
    const map = new Map<string, Deal[]>();

    // First collect all stages that actually have deals
    deals.forEach((d) => {
      if (!map.has(d.stageLabel)) {
        map.set(d.stageLabel, []);
      }
    });

    // Populate with filtered deals
    filteredDeals.forEach((d) => {
      const list = map.get(d.stageLabel) || [];
      list.push(d);
      map.set(d.stageLabel, list);
    });

    // Sort stages logically
    const stages = Array.from(map.entries()).map(([label, stageDeals]) => {
      const totalValue = stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
      return {
        stageLabel: label,
        deals: stageDeals,
        totalValue,
        orderWeight: getStageSortWeight(label),
      };
    });

    stages.sort((a, b) => a.orderWeight - b.orderWeight);
    return stages;
  }, [deals, filteredDeals]);

  if (stageColumns.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
        <Layers className="h-8 w-8 text-slate-500 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-slate-200">No deals match criteria</h3>
        <p className="text-xs text-slate-500 mt-1">Try clearing filters or search queries</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Stage Columns Horizontal Board */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {stageColumns.map((col) => {
          const formattedColValue = new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
            maximumFractionDigits: 0,
          }).format(col.totalValue);

          const isFaded = activeFilter !== 'all' && col.deals.length === 0;

          return (
            <div
              key={col.stageLabel}
              className={`w-72 sm:w-80 shrink-0 flex flex-col bg-slate-950/70 border rounded-2xl p-3 transition ${
                isFaded
                  ? 'border-slate-850 opacity-40 hover:opacity-100'
                  : 'border-slate-800/90 shadow-md shadow-black/20'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800/80">
                <div className="truncate pr-2">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider truncate" title={col.stageLabel}>
                    {col.stageLabel}
                  </h3>
                  <p className="text-[11px] font-mono font-semibold text-emerald-400 mt-0.5">
                    {formattedColValue}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {col.deals.length}
                </span>
              </div>

              {/* Cards inside Stage Column */}
              <div className="space-y-2.5 min-h-[120px]">
                {col.deals.length === 0 ? (
                  <div className="h-24 flex items-center justify-center text-center border border-dashed border-slate-800/60 rounded-xl text-[11px] text-slate-600">
                    No active deals
                  </div>
                ) : (
                  col.deals.map((deal) => (
                    <CompactDealCard
                      key={deal.id}
                      deal={deal}
                      onSelectDeal={onSelectDeal}
                      onSelectDealForAnalysis={onSelectDealForAnalysis}
                      onDraftFollowUp={onDraftFollowUp}
                      onOpenAlignedModal={onOpenAlignedModal}
                      onTagUpdated={onTagUpdated}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
