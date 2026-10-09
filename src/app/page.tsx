'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { KpiHeader } from '@/components/KpiHeader';
import { RadarView } from '@/components/RadarView';
import { DealsTable } from '@/components/DealsTable';
import { TranscriptIntelligenceModal } from '@/components/TranscriptIntelligenceModal';
import { FollowUpModal } from '@/components/FollowUpModal';
import { Deal } from '@/lib/types';
import { Flame, Layers, AlertCircle, RefreshCw, Sparkles, Building2 } from 'lucide-react';

export default function DashboardPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState({
    totalDeals: 0,
    totalPipelineValue: 0,
    urgentCount: 0,
    warningCount: 0,
    healthyCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tab: 'radar' | 'all'
  const [activeTab, setActiveTab] = useState<'radar' | 'all'>('radar');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Modals state
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [selectedDealForAnalysis, setSelectedDealForAnalysis] = useState<Deal | null>(null);
  const [dealForFollowUp, setDealForFollowUp] = useState<Deal | null>(null);

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

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17]">
      <Navbar
        onOpenTranscriptModal={() => handleOpenAnalysis()}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
              Fetching pipeline deals for Ross Jermy
            </p>
          </div>
        ) : (
          <>
            {/* KPI Header Bar */}
            <KpiHeader
              stats={stats}
              filter={activeFilter}
              onSelectFilter={(f) => {
                setActiveFilter(f);
                if (f === 'urgent' || f === 'warning') {
                  setActiveTab('radar');
                } else if (f === 'all') {
                  setActiveTab('all');
                }
              }}
            />

            {/* View Switcher Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('radar')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'radar'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Flame className="h-4 w-4" />
                  <span>Action Radar (Needs Attention)</span>
                  <span className="text-[10px] bg-blue-900/60 text-blue-200 px-1.5 py-0.5 rounded-full ml-1">
                    {stats.urgentCount + stats.warningCount}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'all'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  <span>All Active Pipeline Deals</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full ml-1">
                    {deals.length}
                  </span>
                </button>
              </div>

              <div className="hidden sm:flex items-center text-xs text-slate-400 space-x-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block"></span>
                <span>Owner: Ross Jermy</span>
              </div>
            </div>

            {/* Tab Views */}
            {activeTab === 'radar' ? (
              <RadarView
                deals={deals}
                onSelectDealForAnalysis={(deal) => handleOpenAnalysis(deal)}
                onDraftFollowUp={(deal) => setDealForFollowUp(deal)}
              />
            ) : (
              <DealsTable
                deals={deals}
                activeFilter={activeFilter}
                onSelectDealForAnalysis={(deal) => handleOpenAnalysis(deal)}
                onDraftFollowUp={(deal) => setDealForFollowUp(deal)}
              />
            )}
          </>
        )}
      </main>

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
