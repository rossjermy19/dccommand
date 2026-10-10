'use client';

import React, { useMemo } from 'react';
import { Deal } from '@/lib/types';
import { CompactDealCard } from './CompactDealCard';
import { Layers, Zap, CheckCircle2 } from 'lucide-react';

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

export interface PipelineColumnConfig {
  id: string;
  label: string;
  isLibertyJ?: boolean;
  isClosedWon?: boolean;
  badgeClass?: string;
  columnClass?: string;
}

// Exact pipeline order requested by Ross (Left to Right)
export const PIPELINE_COLUMNS: PipelineColumnConfig[] = [
  { id: 'new', label: 'New', badgeClass: 'bg-slate-200/80 text-slate-800' },
  { id: 'backburning', label: 'Backburning', badgeClass: 'bg-amber-100 text-amber-900 border border-amber-200' },
  { id: 'contact_made', label: 'Contact Made', badgeClass: 'bg-blue-100 text-blue-900 border border-blue-200' },
  {
    id: 'liberty_j',
    label: 'Liberty J',
    isLibertyJ: true,
    badgeClass: 'bg-teal-100 text-teal-900 border border-teal-300 font-bold',
    columnClass: 'bg-teal-50/30 border-teal-200 ring-1 ring-teal-200/50',
  },
  { id: 'no_response', label: 'No Response', badgeClass: 'bg-slate-200/80 text-slate-800' },
  { id: 'meeting_booked', label: 'Meeting Booked', badgeClass: 'bg-indigo-100 text-indigo-900 border border-indigo-200' },
  { id: 'meeting_held', label: 'Meeting Held', badgeClass: 'bg-purple-100 text-purple-900 border border-purple-200' },
  { id: 'upside', label: 'Upside expected to close', badgeClass: 'bg-sky-100 text-sky-900 border border-sky-200' },
  { id: 'committed', label: 'Committed', badgeClass: 'bg-blue-100 text-blue-900 border border-blue-200' },
  { id: 'contract_sent', label: 'Contract Sent', badgeClass: 'bg-amber-100 text-amber-900 border border-amber-200' },
  {
    id: 'closed_won',
    label: 'Closed Won',
    isClosedWon: true,
    badgeClass: 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold',
    columnClass: 'bg-emerald-50/25 border-emerald-200',
  },
];

/**
 * Maps a deal to its respective pipeline column.
 * Returns null if the deal is Closed Lost (which is omitted from the board).
 */
export function getDealPipelineColumnId(deal: Deal): string | null {
  const stageId = (deal.stage || '').toLowerCase();
  const stageLabel = (deal.stageLabel || '').toLowerCase();

  // 1. Exclude Closed Lost completely
  if (
    stageId === 'closedlost' ||
    stageId === '5030008022' ||
    stageId.includes('lost') ||
    stageLabel.includes('closed lost') ||
    stageLabel.includes('lost')
  ) {
    return null;
  }

  // 2. Handed back to Liberty J -> Dedicated "Liberty J" column between Contact Made and No Response
  if (deal.isBackWithLibertyJ) {
    return 'liberty_j';
  }

  // 3. New
  if (
    stageId === 'appointmentscheduled' ||
    stageId === '5030008011' ||
    stageLabel.includes('new lead') ||
    stageLabel === 'new' ||
    stageLabel.startsWith('new ')
  ) {
    return 'new';
  }

  // 4. Backburning
  if (
    stageId === '1638150379' ||
    stageId === '5030008012' ||
    stageId === '5536133318' ||
    stageLabel.includes('back burning') ||
    stageLabel.includes('back burner') ||
    stageLabel.includes('backburning') ||
    stageLabel.includes('re-engage')
  ) {
    return 'backburning';
  }

  // 5. Contact Made
  if (
    stageId === 'qualifiedtobuy' ||
    stageId === '5030008013' ||
    stageId === '2585824485' ||
    stageId === '2181144788' ||
    stageLabel.includes('contact made') ||
    stageLabel.includes('reached out') ||
    stageLabel.includes('to contact') ||
    stageLabel.includes('qualified to buy')
  ) {
    return 'contact_made';
  }

  // 6. No Response
  if (
    stageId === '1352329431' ||
    stageId === '1352329432' ||
    stageId === '5030008014' ||
    stageId === '5030008023' ||
    stageLabel.includes('no response')
  ) {
    return 'no_response';
  }

  // 7. Meeting Booked
  if (
    stageId === '1209215206' ||
    stageId === '5030008015' ||
    stageId === '2181144789' ||
    stageLabel.includes('meeting booked')
  ) {
    return 'meeting_booked';
  }

  // 8. Meeting Held
  if (
    stageId === 'presentationscheduled' ||
    stageId === '5030008016' ||
    stageId === '2585397436' ||
    stageLabel.includes('meeting held') ||
    stageLabel.includes('presentation scheduled')
  ) {
    return 'meeting_held';
  }

  // 9. Upside Expected to Close
  if (
    stageId === '1465977055' ||
    stageId === '1965601015' ||
    stageId === '5030008017' ||
    stageId === '5030008018' ||
    stageLabel.includes('upside') ||
    stageLabel.includes('expected to close') ||
    stageLabel.includes('proposal') ||
    stageLabel.includes('evaluation')
  ) {
    return 'upside';
  }

  // 10. Committed
  if (
    stageId === 'decisionmakerboughtin' ||
    stageId === '5030008019' ||
    stageLabel.includes('committed') ||
    stageLabel.includes('decision maker')
  ) {
    return 'committed';
  }

  // 11. Contract Sent
  if (
    stageId === 'contractsent' ||
    stageId === '5030008020' ||
    stageId === '2181144790' ||
    stageLabel.includes('contract sent') ||
    stageLabel.includes('agreement sent')
  ) {
    return 'contract_sent';
  }

  // 12. Closed Won
  if (
    stageId === 'closedwon' ||
    stageId === '5030008021' ||
    stageId === '2181144791' ||
    stageLabel.includes('closed won') ||
    stageLabel.includes('agreement signed')
  ) {
    return 'closed_won';
  }

  return 'contact_made';
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
  // Filter deals based on active KPI filter, tags, and search
  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      // Exclude Closed Lost entirely from the pipeline board
      const colId = getDealPipelineColumnId(d);
      if (!colId) return false;

      // KPI filter
      if (activeFilter === 'urgent' && d.health !== 'urgent') return false;
      if (activeFilter === 'warning' && d.health !== 'warning') return false;
      if (activeFilter === 'snoozed' && d.health !== 'snoozed') return false;
      if (activeFilter === 'healthy' && d.health !== 'healthy') return false;

      // Tag filter (Dynamic)
      if (selectedTagFilter !== 'ALL') {
        const hasTag =
          d.tags?.includes(selectedTagFilter) ||
          d.source === selectedTagFilter ||
          d.subSource === selectedTagFilter;
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
  }, [deals, activeFilter, selectedTagFilter, searchQuery]);

  // Group filtered deals into the 11 ordered pipeline columns
  const stageColumns = useMemo(() => {
    const dealsByColumn: Record<string, Deal[]> = {};
    PIPELINE_COLUMNS.forEach((col) => {
      dealsByColumn[col.id] = [];
    });

    filteredDeals.forEach((d) => {
      const colId = getDealPipelineColumnId(d);
      if (colId && dealsByColumn[colId]) {
        dealsByColumn[colId].push(d);
      }
    });

    return PIPELINE_COLUMNS.map((col) => {
      const colDeals = dealsByColumn[col.id] || [];
      const totalValue = colDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
      const needsKickCount = col.isLibertyJ
        ? colDeals.filter((d) => (d.daysWithLibertyJ || 0) >= 7).length
        : 0;

      return {
        ...col,
        deals: colDeals,
        totalValue,
        needsKickCount,
      };
    });
  }, [filteredDeals]);

  const totalBoardDeals = useMemo(
    () => stageColumns.reduce((sum, col) => sum + col.deals.length, 0),
    [stageColumns]
  );

  if (totalBoardDeals === 0 && deals.length > 0 && activeFilter !== 'all') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs">
        <Layers className="h-8 w-8 text-slate-400 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-800">No deals match criteria</h3>
        <p className="text-xs text-slate-500 mt-1">Try resetting filters or search queries</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Stage Columns Horizontal Board (Light Mode) */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
        {stageColumns.map((col, index) => {
          const formattedColValue = new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
            maximumFractionDigits: 0,
          }).format(col.totalValue);

          const isFaded = activeFilter !== 'all' && col.deals.length === 0;

          return (
            <div
              key={col.id}
              className={`w-72 sm:w-80 shrink-0 flex flex-col bg-slate-100/70 border rounded-2xl p-3 transition ${
                col.columnClass || 'border-slate-200/90 shadow-2xs'
              } ${isFaded ? 'opacity-40 hover:opacity-100' : ''}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
                <div className="truncate pr-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-black text-slate-400 w-3.5">
                      {index + 1}.
                    </span>

                    {col.isLibertyJ ? (
                      <div className="flex items-center space-x-1.5 truncate">
                        <div className="h-3.5 w-6 bg-white rounded p-0.5 border border-teal-200 shadow-2xs shrink-0 flex items-center justify-center">
                          <img
                            src="/liberty-jai-logo.jpg"
                            alt="Liberty Jai"
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wider truncate">
                          {col.label}
                        </h3>
                      </div>
                    ) : col.isClosedWon ? (
                      <div className="flex items-center space-x-1 truncate text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <h3 className="text-xs font-bold uppercase tracking-wider truncate">
                          {col.label}
                        </h3>
                      </div>
                    ) : (
                      <h3
                        className="text-xs font-bold text-slate-800 uppercase tracking-wider truncate"
                        title={col.label}
                      >
                        {col.label}
                      </h3>
                    )}
                  </div>

                  <p
                    className={`text-[11px] font-mono font-bold mt-0.5 ml-5 ${
                      col.isClosedWon ? 'text-emerald-700 font-extrabold' : 'text-slate-700'
                    }`}
                  >
                    {formattedColValue}
                  </p>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  {col.needsKickCount > 0 && (
                    <span
                      className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-0.5"
                      title={`${col.needsKickCount} deal(s) waiting > 7 days with Liberty J`}
                    >
                      <Zap className="h-2.5 w-2.5 text-amber-600" />
                      <span>{col.needsKickCount} kick</span>
                    </span>
                  )}
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      col.badgeClass || 'bg-white text-slate-700 border border-slate-200 shadow-2xs'
                    }`}
                  >
                    {col.deals.length}
                  </span>
                </div>
              </div>

              {/* Cards inside Stage Column */}
              <div className="space-y-2.5 min-h-[140px]">
                {col.deals.length === 0 ? (
                  <div className="h-28 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 rounded-xl text-[11px] text-slate-400 p-3">
                    <span>No deals in this stage</span>
                    {col.isLibertyJ && (
                      <span className="text-[10px] text-teal-600 mt-1">
                        Push deals back using &quot;To Liberty J&quot;
                      </span>
                    )}
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
