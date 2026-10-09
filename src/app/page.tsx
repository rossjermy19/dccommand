'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { KpiHeader } from '@/components/KpiHeader';
import { DailyMissionControl } from '@/components/DailyMissionControl';
import { StageBoard } from '@/components/StageBoard';
import { RadarView } from '@/components/RadarView';
import { DealsTable } from '@/components/DealsTable';
import { TranscriptIntelligenceModal } from '@/components/TranscriptIntelligenceModal';
import { AlignedStoryModal } from '@/components/AlignedStoryModal';
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
  Filter,
  Zap,
  Target
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

  // View Mode: 'mission' (Default Clear-Desk) | 'stages' | 'radar' | 'table'
  const [viewMode, setViewMode] = useState<'mission' | 'stages' | 'radar' | 'table'>('mission');

  // Filters
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [selectedDealForAnalysis, setSelectedDealForAnalysis] = useState<Deal | null>(null);
  const [dealForFollowUp, setDealForFollowUp] = useState<Deal | null>(null);
  const [selectedDealForDrawer, setSelectedDealForDrawer] = useState<Deal | null>(null);

  // Aligned Story Modal state
  const [isAlignedModalOpen, setIsAlignedModalOpen] = useState(false);
  const [selectedDealForAligned, setSelectedDealForAligned] = useState<Deal | null>(null);

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

  const handleOpenAlignedModal = (deal: Deal) => {
    setSelectedDealForAligned(deal);
    setIsAlignedModalOpen(true);
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
  // Dynamic sources for the filter dropdown
  const availableSources = useMemo(() => {
    const set = new Set<string>();
    deals.forEach((d) => {
      if (d.tags) d.tags.forEach((t) => set.add(t));
      if (d.subSource) {
        set.add(d.subSource === 'Liberty Jai' ? 'Liberty J' : d.subSource);
      }
      if (d.dealSource) set.add(d.dealSource);
    });
    return Array.from(set).filter(Boolean).sort();
  }, [deals]);

  // Compute Liberty J deals count for quick filter button
  const libertyJDealsCount = useMemo(() => {
    return deals.filter(
      (d) =>
        d.tags?.some((t) => /liberty|libby/i.test(t)) ||
        /liberty|libby/i.test(d.subSource || '')
    ).length;
  }, [deals]);

  // Compute pending missions count for the badge
  const pendingMissionsCount = useMemo(() => {
    return deals.filter((d) => d.health === 'urgent' || d.health === 'warning').length;
  }, [deals]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar
        onOpenTranscriptModal={() => handleOpenAnalysis()}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="text-xs bg-rose-100 hover:bg-rose-200 text-rose-800 px-3 py-1.5 rounded-lg font-medium transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
            <h3 className="text-base font-semibold text-slate-800">
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
              onSelectFilter={(f) => {
                setActiveFilter(f);
                // If on Mission Control and user clicks a KPI tile, switch to pipeline view to explore
                if (viewMode === 'mission' && f !== 'all') {
                  setViewMode('stages');
                }
              }}
            />

            {/* Navigation Bar & Mode Switcher */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              {/* Primary Views Tabs */}
              <div className="flex items-center space-x-2 flex-wrap">
                <button
                  onClick={() => setViewMode('mission')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                    viewMode === 'mission'
                      ? 'bg-blue-600 text-white shadow-blue-500/20'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Target className={`h-4 w-4 ${viewMode === 'mission' ? 'text-amber-300' : 'text-amber-500'}`} />
                  <span>Daily Clear-Desk Command</span>
                  {pendingMissionsCount > 0 && (
                    <span className="text-[10px] bg-rose-500 text-white font-extrabold px-1.5 py-0.2 rounded-full ml-1">
                      {pendingMissionsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setViewMode('stages')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shadow-sm ${
                    viewMode === 'stages'
                      ? 'bg-blue-600 text-white shadow-blue-500/20'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Kanban className="h-3.5 w-3.5" />
                  <span>Pipeline Board</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                    viewMode === 'stages' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {deals.length}
                  </span>
                </button>

                <button
                  onClick={() => setViewMode('radar')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shadow-sm ${
                    viewMode === 'radar'
                      ? 'bg-blue-600 text-white shadow-blue-500/20'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Flame className={`h-3.5 w-3.5 ${viewMode === 'radar' ? 'text-amber-300' : 'text-amber-500'}`} />
                  <span>Action Radar</span>
                </button>

                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shadow-sm ${
                    viewMode === 'table'
                      ? 'bg-blue-600 text-white shadow-blue-500/20'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Table className="h-3.5 w-3.5" />
                  <span>All Deals Table</span>
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
                    className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* 1-Click Tag Filter: Liberty J */}
                <button
                  onClick={() =>
                    setSelectedTagFilter(selectedTagFilter === 'Liberty J' ? 'ALL' : 'Liberty J')
                  }
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border shadow-sm ${
                    selectedTagFilter === 'Liberty J'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-100'
                      : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                  }`}
                  title="Filter to deals originating from Liberty J"
                >
                  <span className="text-amber-400">★</span>
                  <span>Liberty J</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedTagFilter === 'Liberty J' ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {libertyJDealsCount}
                  </span>
                </button>

                {/* Dynamic Tag Filter Dropdown */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedTagFilter === 'Liberty J' ? 'ALL' : selectedTagFilter}
                    onChange={(e) => setSelectedTagFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 shadow-sm"
                  >
                    <option value="ALL">All Sources & Tags</option>
                    {availableSources.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
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
                    className="text-[11px] text-slate-600 hover:text-slate-900 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg font-medium transition shadow-sm"
                  >
                    Reset All
                  </button>
                )}
              </div>
            </div>

            {/* View 1: Gamified Daily Mission Control (Default) */}
            {viewMode === 'mission' && (
              <DailyMissionControl
                deals={deals}
                onSelectDeal={(deal) => setSelectedDealForDrawer(deal)}
                onOpenAnalysis={(deal) => handleOpenAnalysis(deal)}
                onDraftFollowUp={(deal) => setDealForFollowUp(deal)}
                onOpenAlignedModal={handleOpenAlignedModal}
                onSwitchToPipelineBoard={() => setViewMode('stages')}
                onRefreshDeals={fetchDeals}
              />
            )}

            {/* View 2: Full-Width Pipeline Stages Board */}
            {viewMode === 'stages' && (
              <StageBoard
                deals={deals}
                activeFilter={activeFilter}
                selectedTagFilter={selectedTagFilter}
                searchQuery={searchQuery}
                onSelectDeal={(deal) => setSelectedDealForDrawer(deal)}
                onSelectDealForAnalysis={(deal) => handleOpenAnalysis(deal)}
                onDraftFollowUp={(deal) => setDealForFollowUp(deal)}
                onOpenAlignedModal={handleOpenAlignedModal}
                onTagUpdated={() => fetchDeals()}
              />
            )}

            {/* View 3: Urgency Action Radar */}
            {viewMode === 'radar' && (
              <RadarView
                deals={deals}
                activeFilter={activeFilter}
                selectedTagFilter={selectedTagFilter}
                searchQuery={searchQuery}
                onSelectDeal={(deal) => setSelectedDealForDrawer(deal)}
                onSelectDealForAnalysis={(deal) => handleOpenAnalysis(deal)}
                onDraftFollowUp={(deal) => setDealForFollowUp(deal)}
                onOpenAlignedModal={handleOpenAlignedModal}
                onTagUpdated={() => fetchDeals()}
              />
            )}

            {/* View 4: High-Density Table */}
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
        onOpenAlignedModal={handleOpenAlignedModal}
        onRefreshDeals={() => fetchDeals()}
      />

      {/* Transcript Intelligence Modal (Fireflies AI Deep-Dive) */}
      <TranscriptIntelligenceModal
        isOpen={isTranscriptModalOpen}
        onClose={() => {
          setIsTranscriptModalOpen(false);
          setSelectedDealForAnalysis(null);
        }}
        deals={deals}
        preselectedDeal={selectedDealForAnalysis}
      />

      {/* Aligned Deal Room Story Generator Modal */}
      <AlignedStoryModal
        isOpen={isAlignedModalOpen}
        onClose={() => {
          setIsAlignedModalOpen(false);
          setSelectedDealForAligned(null);
        }}
        deal={selectedDealForAligned}
        onStorySaved={() => fetchDeals()}
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
