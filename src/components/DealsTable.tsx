'use client';

import React, { useState, useMemo } from 'react';
import { Deal } from '@/lib/types';
import { DealTagBadge } from './DealTagBadge';
import { 
  Search, 
  ExternalLink, 
  Sparkles, 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Calendar,
  Star,
  Bot
} from 'lucide-react';

interface DealsTableProps {
  deals: Deal[];
  activeFilter: string;
  selectedTagFilter?: string;
  onSelectDeal: (deal: Deal) => void;
  onSelectDealForAnalysis: (deal: Deal) => void;
  onDraftFollowUp: (deal: Deal) => void;
  onTagUpdated?: () => void;
}

export function DealsTable({
  deals,
  activeFilter,
  selectedTagFilter = 'ALL',
  onSelectDeal,
  onSelectDealForAnalysis,
  onDraftFollowUp,
  onTagUpdated,
}: DealsTableProps) {
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [sortBy, setSortBy] = useState<'amount' | 'contact' | 'recent'>('recent');

  // Unique stages for filter
  const stages = useMemo(() => {
    const set = new Set<string>();
    deals.forEach((d) => set.add(d.stageLabel));
    return Array.from(set);
  }, [deals]);

  // Filter & Search & Sort
  const filteredDeals = useMemo(() => {
    return deals
      .filter((d) => {
        // Status filter from KPI cards
        if (activeFilter === 'urgent' && d.health !== 'urgent') return false;
        if (activeFilter === 'warning' && d.health !== 'warning') return false;
        if (activeFilter === 'snoozed' && d.health !== 'snoozed') return false;
        if (activeFilter === 'healthy' && d.health !== 'healthy') return false;

        // Tag filter
        if (selectedTagFilter && selectedTagFilter !== 'ALL') {
          const hasTag =
            (selectedTagFilter === 'High Chance' && (d.isGold || d.tags?.includes('High Chance'))) ||
            d.tags?.includes(selectedTagFilter) ||
            d.source === selectedTagFilter ||
            d.subSource === selectedTagFilter;
          if (!hasTag) return false;
        }

        // Stage dropdown
        if (selectedStage !== 'ALL' && d.stageLabel !== selectedStage) return false;

        // Search text
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            d.name.toLowerCase().includes(q) ||
            d.stageLabel.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'amount') return (b.amount || 0) - (a.amount || 0);
        if (sortBy === 'contact') return (b.daysSinceContact || 999) - (a.daysSinceContact || 999);
        return new Date(b.lastModifiedDate).getTime() - new Date(a.lastModifiedDate).getTime();
      });
  }, [deals, activeFilter, selectedTagFilter, selectedStage, search, sortBy]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
      {/* Table Toolbar (Light Theme) */}
      <div className="p-4 sm:p-4.5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search deals by name or pipeline stage..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
          />
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          {/* Stage Dropdown */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="w-full sm:w-auto bg-white border border-slate-200 rounded-lg px-2.5 sm:px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs"
          >
            <option value="ALL">All Stages ({deals.length})</option>
            {stages.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full sm:w-auto bg-white border border-slate-200 rounded-lg px-2.5 sm:px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs"
          >
            <option value="recent">Sort: Most Recently Active</option>
            <option value="amount">Sort: Highest Deal Value</option>
            <option value="contact">Sort: Days Without Contact</option>
          </select>
        </div>
      </div>

      {/* Table Content (Light Theme) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[720px]">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 font-bold">
              <th className="py-3 px-4">Deal Name</th>
              <th className="py-3 px-4">Stage</th>
              <th className="py-3 px-4">Origin / Source</th>
              <th className="py-3 px-4">Value</th>
              <th className="py-3 px-4">Last Touch</th>
              <th className="py-3 px-4">Health Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm bg-white">
            {filteredDeals.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                  No deals match your search criteria.
                </td>
              </tr>
            ) : (
              filteredDeals.map((deal) => {
                const formattedAmount = deal.amount
                  ? new Intl.NumberFormat('en-GB', {
                      style: 'currency',
                      currency: 'GBP',
                      maximumFractionDigits: 0,
                    }).format(deal.amount)
                  : '—';

                return (
                  <tr
                    key={deal.id}
                    onClick={() => onSelectDeal(deal)}
                    className={`transition group cursor-pointer ${
                      deal.isGold
                        ? 'bg-amber-50/80 hover:bg-amber-100/70 border-l-4 border-l-amber-400'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Deal Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center space-x-1.5 flex-wrap">
                        {deal.isGold && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-200/90 text-amber-950 px-1.5 py-0.5 rounded border border-amber-300 shadow-2xs">
                            ⭐ Gold
                          </span>
                        )}
                        <span>{deal.name}</span>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-70 transition text-slate-400" />
                      </div>
                      <div className="text-[11px] text-slate-400">ID: {deal.id}</div>
                    </td>

                    {/* Stage */}
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {deal.stageLabel}
                      </span>
                    </td>

                    {/* Origin / Tags */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <DealTagBadge
                        dealId={deal.id}
                        tags={deal.tags}
                        subSource={deal.subSource}
                        onTagUpdated={onTagUpdated}
                      />
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                      {formattedAmount}
                    </td>

                    {/* Last Touch */}
                    <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">
                      {deal.daysSinceContact !== null ? (
                        <span>
                          {deal.daysSinceContact === 0
                            ? 'Today'
                            : deal.daysSinceContact === 1
                            ? 'Yesterday'
                            : `${deal.daysSinceContact}d ago`}
                        </span>
                      ) : (
                        <span className="text-slate-400">None logged</span>
                      )}
                    </td>

                    {/* Health Status */}
                    <td className="py-3.5 px-4">
                      {deal.health === 'urgent' && (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircle className="h-3 w-3 text-rose-600" />
                          <span>Stalled &gt; 7d</span>
                        </span>
                      )}
                      {deal.health === 'warning' && (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="h-3 w-3 text-amber-600" />
                          <span>Action Due</span>
                        </span>
                      )}
                      {deal.health === 'snoozed' && (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Calendar className="h-3 w-3 text-indigo-600" />
                          <span>Planned</span>
                        </span>
                      )}
                      {deal.health === 'healthy' && (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="h-3 w-3 text-emerald-600" />
                          <span>In Rhythm</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5 sm:space-x-2">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await fetch(`/api/hubspot/deal/${deal.id}/gold`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ isGold: !deal.isGold, dealName: deal.name }),
                              });
                              if (onTagUpdated) onTagUpdated();
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          title={deal.isGold ? 'High Chance deal (Gold) — Click to unmark' : 'Mark as High Chance (Gold deal)'}
                          className={`p-1.5 rounded-lg transition ${
                            deal.isGold
                              ? 'bg-amber-200 text-amber-950 hover:bg-amber-300'
                              : 'bg-slate-100 hover:bg-amber-50 text-slate-400 hover:text-amber-600'
                          }`}
                        >
                          <Star className={`h-3.5 w-3.5 ${deal.isGold ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDealForAnalysis(deal);
                          }}
                          title="Fireflies AI Meeting Analysis"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 transition"
                        >
                          <Bot className="h-3.5 w-3.5 text-purple-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDraftFollowUp(deal);
                          }}
                          title="Draft Follow-up Email"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </button>
                        <a
                          href={deal.hubspotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="View in HubSpot CRM"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
