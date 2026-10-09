'use client';

import React, { useState, useMemo } from 'react';
import { Deal } from '@/lib/types';
import { 
  Search, 
  ExternalLink, 
  Filter, 
  Sparkles, 
  Mail, 
  ArrowUpDown,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar
} from 'lucide-react';

interface DealsTableProps {
  deals: Deal[];
  activeFilter: string;
  onSelectDeal: (deal: Deal) => void;
  onSelectDealForAnalysis: (deal: Deal) => void;
  onDraftFollowUp: (deal: Deal) => void;
}

export function DealsTable({
  deals,
  activeFilter,
  onSelectDeal,
  onSelectDealForAnalysis,
  onDraftFollowUp,
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
        if (activeFilter === 'healthy' && d.health !== 'healthy') return false;

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
  }, [deals, activeFilter, selectedStage, search, sortBy]);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search deals by name or pipeline stage..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          {/* Stage Dropdown */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
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
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="recent">Sort: Most Recently Active</option>
            <option value="amount">Sort: Highest Deal Value</option>
            <option value="contact">Sort: Days Without Contact</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/40">
              <th className="py-3.5 px-4 font-semibold">Deal Name</th>
              <th className="py-3.5 px-4 font-semibold">Stage</th>
              <th className="py-3.5 px-4 font-semibold">Value</th>
              <th className="py-3.5 px-4 font-semibold">Last Touch</th>
              <th className="py-3.5 px-4 font-semibold">Health Status</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {filteredDeals.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
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
                    className="hover:bg-slate-800/40 transition group cursor-pointer"
                  >
                    {/* Deal Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white group-hover:text-blue-400 transition flex items-center space-x-1.5">
                        <span>{deal.name}</span>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-70 transition text-slate-400" />
                      </div>
                      <div className="text-[11px] text-slate-500">ID: {deal.id}</div>
                    </td>

                    {/* Stage */}
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700/80">
                        {deal.stageLabel}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                      {formattedAmount}
                    </td>

                    {/* Last Touch */}
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {deal.daysSinceContact !== null ? (
                        <span>
                          {deal.daysSinceContact === 0
                            ? 'Today'
                            : deal.daysSinceContact === 1
                            ? 'Yesterday'
                            : `${deal.daysSinceContact}d ago`}
                        </span>
                      ) : (
                        <span className="text-slate-500">None logged</span>
                      )}
                    </td>

                    {/* Health Status */}
                    <td className="py-3.5 px-4">
                      {deal.health === 'urgent' && (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/30">
                          <AlertCircle className="h-3 w-3" />
                          <span>Ghosting Risk</span>
                        </span>
                      )}
                      {deal.health === 'warning' && (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          <Clock className="h-3 w-3" />
                          <span>Action Due</span>
                        </span>
                      )}
                      {deal.health === 'snoozed' && (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                          <Calendar className="h-3 w-3" />
                          <span>Planned Follow-up</span>
                        </span>
                      )}
                      {deal.health === 'healthy' && (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle className="h-3 w-3" />
                          <span>Active</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onSelectDealForAnalysis(deal)}
                          title="Analyze Call / Meeting"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDraftFollowUp(deal)}
                          title="Draft Follow-up Email"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </button>
                        <a
                          href={deal.hubspotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open in HubSpot"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
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

      <div className="p-3 bg-slate-950/40 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <span>Showing {filteredDeals.length} of {deals.length} active deals</span>
        <span className="text-[11px] text-slate-500">Directly synchronized with HubSpot CRM</span>
      </div>
    </div>
  );
}
