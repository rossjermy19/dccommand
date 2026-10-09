'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { KpiHeader } from '@/components/KpiHeader';
import { StageBoard } from '@/components/StageBoard';
import { RadarView } from '@/components/RadarView';
import { DealsTable } from '@/components/DealsTable';
import { TranscriptIntelligenceModal } from '@/components/TranscriptIntelligenceModal';
import { FollowUpModal } from '@/components/FollowUpModal';
import { DealDrawer } from '@/components/DealDrawer';
import { Deal } from '@/lib/types';
import { 
  Flame, 
  Layers, 
  AlertCircle, 
  RefreshCw, 
  Kanban, 
  Table, 
  Search, 
  Tag, 
  X, 
  Sparkles,
  Filter
} from 'lucide-react';

export default function DashboardPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState({
    totalDeals: 0,
    totalPipelineValue: 0,
    urgentCount: 0,
    warningCount: 0,
    healthyCount: 0,
    snoozedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View Mode: 'stages' | 'radar' | 'table'
  const [viewMode, setViewMode] = useState<'stages' | 'radar' | 'table'>('stages');

  // Filters
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [selectedDealForAnalysis, setSelectedDealForAnalysis] = useState<Deal | null>(null);
  const [dealForFollowUp, setDealForFollowUp] = useState<Deal | null>(null);
  const [selectedDealForDrawer, setSelectedDealForDrawer] = useState<Deal | null>(null);

  const fetchDeals = async () => {
    try {
      setError(null);
      const res = await fetch('/api/hubspot/deals');
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch deals');
      }
      setDeals(data.deals || []);
      setStats(data.stats || {
        totalDeals: 0,
        totalPipelineValue: 0,
        urgentCount: 0,
        warningCount: 0,
        healthyCount: 0,
        snoozedCount: 0,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error connecting to HubSpot API');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDeals();
  };

  const handleOpenAnalysis = (deal?: Deal) => {
    setSelectedDealForAnalysis(deal || null);
    setIsTranscriptModalOpen(true);
  };

  const handleLogNote = async (dealId: string, noteBody: string) => {
    const res = await fetch('/api/hubspot/note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealId, noteBody }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    fetchDeals(); // Refresh
  };

  // Compute Libby deals count for quick filter button
  const libbyDealsCount = useMemo(() => {
    return deals.filter(
      (d) =>
        d.tags?.some((t) => /libby|liberty/i.test(t)) ||
        /libby|liberty/i.test(d.subSource || '')
    ).length;
  }, [deals]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17]">
      <Navbar
        onOpenTranscriptModal={() => handleOpenAnalysis()}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="text-xs bg-rose-500/20 hover:bg-rose-500/30 px-3 py-1.5 rounded-lg font-medium transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">
              Synchronizing with HubSpot CRM...
            </h3>
            <p className="text-xs text-slate-500">
              Fetching pipeline deals and associated touchpoints for Ross Jermy
            </p>
          </div>
        ) : (
          <>
            {/* Top Interactive KPI Tiles */}
            <KpiHeader
              stats={stats}
              filter={activeFilter}
              onSelectFilter={(f) => setActiveFilter(f)}
            />

            {/* View Switcher & Toolbar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              {/* View Switcher Tabs */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('stages')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                    viewMode === 'stages'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Kanban className="h-3.5 w-3.5" />
                  <span>Stage Board</span>
                </button>

                <button
                  onClick={() => setViewMode('radar')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                    viewMode === 'radar'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Flame className="h-3.5 w-3.5 text-amber-400" />
                  <span>Action Radar</span>
                  <span className="text-[10px] bg-blue-900/60 text-blue-200 px-1.5 py-0.5 rounded-full ml-0.5">
                    {stats.urgentCount + stats.warningCount}
                  </span>
                </button>

                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                    viewMode === 'table'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Table className="h-3.5 w-3.5" />
                  <span>Pipeline Table</span>
                </button>
              </div>

              {/* Tag Filters & Search Box */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search Input */}
                <div className="relative min-w-[200px] sm:min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search deals, tags, stages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* 1-Click Tag Filter: Libby */}
                <button
                  onClick={() =>
                    setSelectedTagFilter(selectedTagFilter === 'Libby' ? 'ALL' : 'Libby')
                  }
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition border ${
                    selectedTagFilter === 'Libby'
                      ? 'bg-purple-900/80 text-purple-200 border-purple-500 shadow-sm ring-1 ring-purple-500'
                      : 'bg-purple-950/40 text-purple-300 border-purple-500/40 hover:bg-purple-900/50'
                  }`}
                  title="Filter to only deals originating from Libby"
                >
                  <span className="text-amber-400">★</span>
                  <span>Libby Deals</span>
                  <span className="text-[10px] bg-purple-900 text-purple-200 px-1.5 py-0.2 rounded-full">
                    {libbyDealsCount}
                  </span>
                </button>

                {/* Tag Filter Dropdown */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedTagFilter === 'Libby' ? 'ALL' : selectedTagFilter}
                    onChange={(e) => setSelectedTagFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">All Sources</option>
                    <option value="Partnerships - Evri">Partnerships - Evri</option>
                    <option value="Customer Refferal">Customer Referral</option>
                    <option value="SDR">SDR Outbound</option>
                    <option value="Direct">Direct</option>
                    <option value="Orders Shopify">Shopify</option>
                    <option value="Outbound">Outbound</option>
                    <option value="Partnership">Partnership</option>
                  </select>
                </div>

                {/* Reset Filters button */}
                {(activeFilter !== 'all' || selectedTagFilter !== 'ALL' || searchQuery) && (
                  <button
                    onClick={() => {
                      setActiveFilter('all');
                      setSelectedTagFilter('ALL');
                      setSearchQuery('');
                    }}
                    className="text-[11px] text-slate-400 hover:text-white px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-md transition"
                  >
                    Reset All
                  </button>
                )}
              </div>
            </div>

            {/* Active Views */}
            {viewMode === 'stages' && (
              <StageBoard
                deals={deals}
                activeFilter={activeFilter}
                selectedTagFilter={selectedTagFilter}
                searchQuery={searchQuery}
                onSelectDeal={(deal) => setSelectedDealForDrawer(deal)}
                onSelectDealForAnalysis={(deal) => handleOpenAnalysis(deal)}
                onDraftFollowUp={(deal) => setDealForFollowUp(deal)}
                onTagUpdated={() => fetchDeals()}
              />
            )}

            {viewMode === 'radar' && (
              <RadarView
                deals={deals}
                activeFilter={activeFilter}
                selectedTagFilter={selectedTagFilter}
                searchQuery={searchQuery}
                onSelectDeal={(deal) => setSelectedDealForDrawer(deal)}
                onSelectDealForAnalysis={(deal) => handleOpenAnalysis(deal)}
                onDraftFollowUp={(deal) => setDealForFollowUp(deal)}
                onTagUpdated={() => fetchDeals()}
              />
            )}

            {viewMode === 'table' && (
              <DealsTable
                deals={deals}
                activeFilter={activeFilter}
                selectedTagFilter={selectedTagFilter}
                onSelectDeal={(deal) => setSelectedDealForDrawer(deal)}
                onSelectDealForAnalysis={(deal) => handleOpenAnalysis(deal)}
                onDraftFollowUp={(deal) => setDealForFollowUp(deal)}
                onTagUpdated={() => fetchDeals()}
              />
            )}
          </>
        )}
      </main>

      {/* Deal Details Drawer (Notes, Tasks, Contacts, Emails, Tags) */}
      <DealDrawer
        deal={selectedDealForDrawer}
        onClose={() => setSelectedDealForDrawer(null)}
        onOpenAnalysis={(deal) => handleOpenAnalysis(deal)}
        onDraftFollowUp={(deal) => setDealForFollowUp(deal)}
        onRefreshDeals={() => fetchDeals()}
      />

      {/* Transcript Intelligence Modal */}
      <TranscriptIntelligenceModal
        isOpen={isTranscriptModalOpen}
        onClose={() => {
          setIsTranscriptModalOpen(false);
          setSelectedDealForAnalysis(null);
        }}
        deals={deals}
        preselectedDeal={selectedDealForAnalysis}
      />

      {/* Follow-up Email Drafter Modal */}
      <FollowUpModal
        deal={dealForFollowUp}
        onClose={() => setDealForFollowUp(null)}
        onLogNote={handleLogNote}
      />
    </div>
  );
}
