'use client';

import React, { useState, useMemo } from 'react';
import { Deal } from '@/lib/types';
import { 
  Trophy, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  Mail, 
  FileText, 
  ChevronRight, 
  Check, 
  ExternalLink,
  Kanban,
  Zap,
  Filter,
  Archive,
  RotateCcw,
  Copy
} from 'lucide-react';
import { DealTagBadge } from './DealTagBadge';
import { ClosedLostModal } from './ClosedLostModal';
import { LibertyJModal } from './LibertyJModal';

interface DailyMissionControlProps {
  deals: Deal[];
  onSelectDeal: (deal: Deal) => void;
  onOpenAnalysis: (deal: Deal) => void;
  onDraftFollowUp: (deal: Deal) => void;
  onOpenAlignedModal: (deal: Deal) => void;
  onSwitchToPipelineBoard: () => void;
  onRefreshDeals: () => void;
}

interface MissionItem {
  id: string;
  deal: Deal;
  type: 'stalled' | 'action_due' | 'new_deal' | 'aligned_story';
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
}

export function DailyMissionControl({
  deals,
  onSelectDeal,
  onOpenAnalysis,
  onDraftFollowUp,
  onOpenAlignedModal,
  onSwitchToPipelineBoard,
  onRefreshDeals,
}: DailyMissionControlProps) {
  const [clearedMissionIds, setClearedMissionIds] = useState<Set<string>>(() => new Set());
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'action_due' | 'stalled' | 'new_deal' | 'aligned_story' | 'liberty_j'>('all');

  // Quick Plan date state for in-card scheduling
  const [schedulingDealId, setSchedulingDealId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
  const [closedLostDeal, setClosedLostDeal] = useState<Deal | null>(null);
  const [libertyJModalDeal, setLibertyJModalDeal] = useState<Deal | null>(null);
  const [libertyJModalMode, setLibertyJModalMode] = useState<'push' | 'kick' | 'recall'>('push');
  const [copiedLibertyJList, setCopiedLibertyJList] = useState(false);

  // Liberty J Partner Deals computation
  const libertyJDeals = useMemo(() => deals.filter((d) => d.isBackWithLibertyJ), [deals]);
  const libertyJTotalValue = useMemo(() => libertyJDeals.reduce((sum, d) => sum + (d.amount || 0), 0), [libertyJDeals]);
  const libertyJNeedsKickCount = useMemo(() => libertyJDeals.filter((d) => (d.daysWithLibertyJ || 0) >= 7).length, [libertyJDeals]);

  // Generate dynamic missions from deals
  const rawMissions = useMemo<MissionItem[]>(() => {
    const list: MissionItem[] = [];

    deals.forEach((deal) => {
      // Ignore Closed Won deals for daily missions
      if (deal.stage === 'closedwon' || deal.stage === '5030008021' || deal.stageLabel.toLowerCase().includes('closed won')) {
        return;
      }

      // 1. 7-Day Inactivity Review (>=7 days without note/touch and no future task/meeting)
      if (deal.health === 'urgent') {
        list.push({
          id: `stalled_${deal.id}`,
          deal,
          type: 'stalled',
          title: `7-Day Review: Last touch ${deal.daysSinceContact || 7}d ago`,
          description: `No contact in ${deal.daysSinceContact || 7} days with no next step scheduled. Add a note, plan follow-up, or send email.`,
          urgency: 'high',
        });
      }

      // 2. Action Due (unfulfilled task specifically due today or overdue)
      else if (deal.health === 'warning') {
        list.push({
          id: `action_${deal.id}`,
          deal,
          type: 'action_due',
          title: deal.nextTaskSubject ? `Task due: ${deal.nextTaskSubject}` : `Action due: Follow-up required`,
          description: deal.healthReason || `Deliverable or proposal due for ${deal.name}.`,
          urgency: 'high',
        });
      }

      // 3. Fresh Uncontacted Opportunity (< 14 days old and never contacted)
      else if (deal.isNewDeal && deal.daysSinceContact === null) {
        list.push({
          id: `new_${deal.id}`,
          deal,
          type: 'new_deal',
          title: `Fresh Opportunity Landed`,
          description: `New lead in ${deal.stageLabel}. Review pre-call notes and confirm intro appointment.`,
          urgency: 'medium',
        });
      }
    });

    return list;
  }, [deals]);

  // Filter out cleared missions
  const activeMissions = useMemo(() => {
    return rawMissions
      .filter((m) => !clearedMissionIds.has(m.id))
      .filter((m) => {
        if (statusFilter === 'all') return true;
        return m.type === statusFilter;
      });
  }, [rawMissions, clearedMissionIds, statusFilter]);

  const unclearedAllMissions = useMemo(() => {
    return rawMissions.filter((m) => !clearedMissionIds.has(m.id));
  }, [rawMissions, clearedMissionIds]);

  const totalCount = unclearedAllMissions.length;
  const stalledCount = unclearedAllMissions.filter((m) => m.type === 'stalled').length;
  const actionDueCount = unclearedAllMissions.filter((m) => m.type === 'action_due').length;
  const newDealCount = unclearedAllMissions.filter((m) => m.type === 'new_deal').length;
  const alignedCount = unclearedAllMissions.filter((m) => m.type === 'aligned_story').length;

  const clearedCount = clearedMissionIds.size;
  const completionPercentage = (clearedCount + unclearedAllMissions.length) > 0 
    ? Math.min(100, Math.round((clearedCount / (clearedCount + unclearedAllMissions.length)) * 100))
    : 100;

  // Clear an item with animation
  const clearMission = (missionId: string) => {
    setAnimatingId(missionId);
    setTimeout(() => {
      setClearedMissionIds((prev) => new Set(prev).add(missionId));
      setAnimatingId(null);
    }, 250);
  };

  // 1-Click quick schedule follow-up task directly in HubSpot
  const handleQuickSchedule = async (deal: Deal, targetDateStr: string, subject: string) => {
    if (!targetDateStr || isSubmittingSchedule) return;
    setIsSubmittingSchedule(true);
    try {
      const res = await fetch('/api/hubspot/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          subject: subject || `Follow-up with ${deal.name}`,
          dueDate: targetDateStr,
        }),
      });
      const data = await res.json();
      if (data.success) {
        clearMission(`stalled_${deal.id}`);
        setSchedulingDealId(null);
        onRefreshDeals();
      }
    } catch (err) {
      console.error('Failed to schedule task:', err);
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Gamified Header: Clean Light Mode Banner */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 border border-blue-100 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100/80 text-blue-800 border border-blue-200">
                <Zap className="h-3.5 w-3.5 text-blue-600" />
                <span>Daily Clear-Desk Command</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">Ross Jermy</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {unclearedAllMissions.length === 0
                ? "Clean Desk Achieved!"
                : `${unclearedAllMissions.length} active deal actions today.`}
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">
              {unclearedAllMissions.length === 0
                ? "Every deal has active communication or a planned next date. Your pipeline is in healthy momentum."
                : "Act on these priority items so nothing slips. Each card disappears as you complete or schedule it."}
            </p>
          </div>

          {/* Progress Bar Widget */}
          <div className="w-full md:w-72 bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs shrink-0">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-slate-700 flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                <span>Daily Progress</span>
              </span>
              <span className="font-mono text-emerald-700">{completionPercentage}%</span>
            </div>
            
            {/* Progress bar track */}
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-medium">
              <span>{clearedCount} completed</span>
              <span>{unclearedAllMissions.length} remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filters Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          All Items ({totalCount})
        </button>

        {actionDueCount > 0 && (
          <button
            onClick={() => setStatusFilter('action_due')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'action_due'
                ? 'bg-amber-600 text-white shadow-2xs font-bold'
                : 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Clock className="h-3 w-3" />
            <span>Action Due ({actionDueCount})</span>
          </button>
        )}

        {stalledCount > 0 && (
          <button
            onClick={() => setStatusFilter('stalled')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'stalled'
                ? 'bg-rose-600 text-white shadow-2xs font-bold'
                : 'bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100'
            }`}
          >
            <Flame className="h-3 w-3" />
            <span>Stalled &gt; 7d ({stalledCount})</span>
          </button>
        )}

        {newDealCount > 0 && (
          <button
            onClick={() => setStatusFilter('new_deal')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'new_deal'
                ? 'bg-sky-600 text-white shadow-2xs font-bold'
                : 'bg-sky-50 border border-sky-200 text-sky-800 hover:bg-sky-100'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span>New Deals ({newDealCount})</span>
          </button>
        )}

        {alignedCount > 0 && (
          <button
            onClick={() => setStatusFilter('aligned_story')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'aligned_story'
                ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                : 'bg-indigo-50 border border-indigo-200 text-indigo-800 hover:bg-indigo-100'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span>Aligned Stories ({alignedCount})</span>
          </button>
        )}

        <button
          onClick={() => setStatusFilter(statusFilter === 'liberty_j' ? 'all' : 'liberty_j')}
          className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 flex items-center gap-1.5 ${
            statusFilter === 'liberty_j'
              ? 'bg-teal-700 text-white shadow-2xs'
              : 'bg-teal-50 border border-teal-200 text-teal-900 hover:bg-teal-100'
          }`}
        >
          <div className="h-3.5 w-6 bg-white rounded p-0.5 flex items-center justify-center shrink-0 border border-teal-200 shadow-2xs">
            <img src="/liberty-jai-logo.jpg" alt="Liberty Jai" className="h-full w-full object-contain" />
          </div>
          <span>Liberty J Queue ({libertyJDeals.length})</span>
          {libertyJNeedsKickCount > 0 && (
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" title={`${libertyJNeedsKickCount} deals waiting 7+ days need a kick`}></span>
          )}
        </button>
      </div>

      {/* Liberty J Dedicated Queue View */}
      {statusFilter === 'liberty_j' ? (
        <div className="space-y-4">
          {/* Liberty J Command Banner */}
          <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-slate-50 border border-teal-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="h-12 w-20 bg-white border border-teal-200 rounded-xl p-1.5 flex items-center justify-center shadow-2xs overflow-hidden shrink-0">
                  <img src="/liberty-jai-logo.jpg" alt="Liberty Jai" className="h-full w-full object-contain" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    Liberty J Partner Queue
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 max-w-lg">
                    Deals currently handed back to Liberty J for them to reach out and chase. These deals are kept off your active daily desk until re-engaged.
                  </p>
                </div>
              </div>

              {/* Quick Copy Catch-up List */}
              <button
                onClick={() => {
                  const text = [
                    `Liberty J Follow-up Chase List (${new Date().toLocaleDateString('en-GB')}):`,
                    ...libertyJDeals.map((d, i) => `${i + 1}. ${d.name} (${d.amount ? '£' + d.amount.toLocaleString() : 'No amount'}) - With Liberty J for ${d.daysWithLibertyJ || 0}d${(d.daysWithLibertyJ || 0) >= 7 ? ' [Needs Kick]' : ''}`)
                  ].join('\n');
                  navigator.clipboard.writeText(text);
                  setCopiedLibertyJList(true);
                  setTimeout(() => setCopiedLibertyJList(false), 2500);
                }}
                className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-teal-200 text-teal-900 rounded-xl text-xs font-bold shadow-2xs transition shrink-0"
              >
                {copiedLibertyJList ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-teal-700" />}
                <span>{copiedLibertyJList ? 'Copied Chase List!' : 'Copy Liberty J Catch-up List'}</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-teal-200/70">
              <div className="bg-white/80 p-2.5 rounded-xl border border-teal-100">
                <p className="text-[10.5px] uppercase font-bold text-slate-500">Deals with Partner</p>
                <p className="text-lg font-black text-slate-900 mt-0.5">{libertyJDeals.length}</p>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-teal-100">
                <p className="text-[10.5px] uppercase font-bold text-slate-500">Pipeline Value</p>
                <p className="text-lg font-black text-emerald-700 font-mono mt-0.5">
                  {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(libertyJTotalValue)}
                </p>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-teal-100">
                <p className="text-[10.5px] uppercase font-bold text-slate-500">Waiting &gt; 7 Days</p>
                <p className="text-lg font-black text-amber-600 mt-0.5 flex items-center gap-1">
                  <span>{libertyJNeedsKickCount}</span>
                  {libertyJNeedsKickCount > 0 && <span className="text-[11px] font-bold text-amber-700">Needs Kick</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Cards for Deals with Liberty J */}
          {libertyJDeals.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
              No deals currently sitting with Liberty J. You can push any deal back to Liberty J using the &quot;To Liberty J&quot; button.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {libertyJDeals.map((deal) => {
                const days = deal.daysWithLibertyJ || 0;
                const needsKick = days >= 7;

                return (
                  <div
                    key={deal.id}
                    className={`bg-white rounded-xl border p-4 shadow-2xs space-y-3 transition ${
                      needsKick ? 'border-amber-300 ring-1 ring-amber-200/50' : 'border-teal-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            needsKick ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-teal-100 text-teal-900'
                          }`}>
                            {days}d with Liberty J
                          </span>
                          {needsKick && (
                            <span className="text-[10px] font-extrabold text-amber-700 flex items-center gap-0.5">
                              <Zap className="h-3 w-3" />
                              <span>Give them a kick!</span>
                            </span>
                          )}
                        </div>
                        <h4
                          onClick={() => onSelectDeal(deal)}
                          className="text-base font-bold text-slate-900 hover:text-blue-600 transition cursor-pointer"
                        >
                          {deal.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Stage: <span className="font-semibold text-slate-700">{deal.stageLabel}</span> • Amount: <span className="font-mono font-bold text-emerald-700">{deal.amount ? `£${deal.amount.toLocaleString()}` : '£—'}</span>
                        </p>
                      </div>

                      <a
                        href={deal.hubspotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition"
                        title="Open in HubSpot"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setLibertyJModalDeal(deal);
                            setLibertyJModalMode('kick');
                          }}
                          className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs"
                        >
                          <Zap className="h-3.5 w-3.5" />
                          <span>Give Kick</span>
                        </button>

                        <button
                          onClick={() => {
                            setLibertyJModalDeal(deal);
                            setLibertyJModalMode('recall');
                          }}
                          className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 transition"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Recall to Desk</span>
                        </button>
                      </div>

                      <button
                        onClick={() => onSelectDeal(deal)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                        title="View Timeline & Details"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : unclearedAllMissions.length === 0 ? (
        <div className="bg-white border border-emerald-200 rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200">
            <Trophy className="h-7 w-7 text-amber-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Zero Pending Actions!</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
              Outstanding work, Ross. All deals are moving forward with active touchpoints or planned dates.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onSwitchToPipelineBoard}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm shadow-blue-500/20 transition"
            >
              <Kanban className="h-4 w-4" />
              <span>Explore Full Pipeline Board</span>
            </button>
          </div>
        </div>
      ) : activeMissions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
          No items match the selected status filter.
        </div>
      ) : (
        /* Action Queue Cards: SIDE-BY-SIDE 2-COLUMN GRID */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activeMissions.map((mission) => {
            const isAnimating = animatingId === mission.id;
            const formattedAmount = mission.deal.amount
              ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(mission.deal.amount)
              : '£—';

            return (
              <div
                key={mission.id}
                className={`bg-white border rounded-xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-250 flex flex-col justify-between space-y-3 relative ${
                  isAnimating ? 'opacity-0 scale-95 -translate-y-2' : 'opacity-100 scale-100'
                } ${
                  mission.type === 'stalled'
                    ? 'border-rose-200 hover:border-rose-300'
                    : mission.type === 'action_due'
                    ? 'border-amber-200 hover:border-amber-300'
                    : mission.type === 'new_deal'
                    ? 'border-sky-200 hover:border-sky-300'
                    : 'border-indigo-200 hover:border-indigo-300'
                }`}
              >
                {/* Card Top Row: Urgency badge, Stage, Amount */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {mission.type === 'stalled' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <Flame className="h-3 w-3 text-rose-600" />
                          <span>STALLED RISK</span>
                        </span>
                      )}
                      {mission.type === 'action_due' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="h-3 w-3 text-amber-600" />
                          <span>ACTION DUE</span>
                        </span>
                      )}
                      {mission.type === 'new_deal' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                          <Sparkles className="h-3 w-3 text-sky-600" />
                          <span>NEW DEAL</span>
                        </span>
                      )}
                      {mission.type === 'aligned_story' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Sparkles className="h-3 w-3 text-indigo-600" />
                          <span>ALIGNED STORY</span>
                        </span>
                      )}

                      {/* Source tag chip (Liberty J, etc.) */}
                      <DealTagBadge
                        dealId={mission.deal.id}
                        tags={mission.deal.tags}
                        subSource={mission.deal.subSource}
                        onTagUpdated={onRefreshDeals}
                      />
                    </div>

                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {formattedAmount}
                    </span>
                  </div>

                  {/* Deal Title */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4
                        onClick={() => onSelectDeal(mission.deal)}
                        className="text-base font-bold text-slate-900 hover:text-blue-600 transition cursor-pointer flex items-center gap-1"
                      >
                        <span>{mission.deal.name}</span>
                        <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Stage: <span className="text-slate-700 font-semibold">{mission.deal.stageLabel}</span> • {mission.deal.daysSinceContact !== null ? `${mission.deal.daysSinceContact}d since last touch` : 'No touch yet'}
                      </p>
                    </div>

                    <a
                      href={mission.deal.hubspotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition shrink-0"
                      title="Open in HubSpot"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  {/* Context & Description */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-xs text-slate-700">
                    <p className="font-medium">{mission.description}</p>
                  </div>
                </div>

                {/* Bottom Row: Resolution Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Resolution Action 1: Post-Call Aligned Story */}
                    {mission.type === 'aligned_story' && (
                      <button
                        onClick={() => {
                          onOpenAlignedModal(mission.deal);
                          clearMission(mission.id);
                        }}
                        className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs transition"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Aligned Story</span>
                      </button>
                    )}

                    {/* Resolution Action 2: Email Drafter */}
                    <button
                      onClick={() => {
                        onDraftFollowUp(mission.deal);
                        clearMission(mission.id);
                      }}
                      className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>Draft Email</span>
                    </button>

                    {/* Resolution Action 3: Quick Plan / Schedule */}
                    {schedulingDealId === mission.deal.id ? (
                      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300 shadow-2xs">
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="bg-slate-50 border border-slate-200 text-slate-900 text-xs px-2 py-1 rounded"
                        />
                        <button
                          onClick={() => handleQuickSchedule(mission.deal, scheduleDate, `Follow-up with ${mission.deal.name}`)}
                          disabled={!scheduleDate || isSubmittingSchedule}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-xs font-bold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setSchedulingDealId(null)}
                          className="text-slate-400 hover:text-slate-600 px-1 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 7);
                          setScheduleDate(d.toISOString().split('T')[0]);
                          setSchedulingDealId(mission.deal.id);
                        }}
                        className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 transition"
                      >
                        <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Plan Follow-up</span>
                      </button>
                    )}

                    {/* Resolution Action 4: Quick Mark Meeting Booked in HubSpot */}
                    <button
                      onClick={async () => {
                        try {
                          await fetch(`/api/hubspot/deal/${mission.deal.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ stage: '1209215206' }),
                          });
                          clearMission(mission.id);
                          if (onRefreshDeals) onRefreshDeals();
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-blue-200 transition"
                      title="Move deal to Meeting Booked in HubSpot CRM"
                    >
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                      <span>Meeting Booked</span>
                    </button>

                    {/* Resolution Action: Push to Liberty J */}
                    <button
                      onClick={() => {
                        setLibertyJModalDeal(mission.deal);
                        setLibertyJModalMode('push');
                      }}
                      className="flex items-center space-x-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-teal-200 transition"
                      title="Push deal back to Liberty J for them to chase up"
                    >
                      <div className="h-3 w-5 bg-white rounded p-0.5 flex items-center justify-center shrink-0 border border-teal-200 shadow-2xs">
                        <img src="/liberty-jai-logo.jpg" alt="Liberty Jai" className="h-full w-full object-contain" />
                      </div>
                      <span>To Liberty J</span>
                    </button>

                    {/* Resolution Action 5: Quick Mark Lost */}
                    <button
                      onClick={() => setClosedLostDeal(mission.deal)}
                      className="flex items-center space-x-1.5 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 hover:border-rose-200 transition"
                      title="Mark deal as Closed Lost in HubSpot"
                    >
                      <Archive className="h-3.5 w-3.5 text-rose-500" />
                      <span>Lost</span>
                    </button>

                    {/* Timeline Drawer */}
                    <button
                      onClick={() => onSelectDeal(mission.deal)}
                      title="View Timeline & Details"
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Quick Done checkmark */}
                  <button
                    onClick={() => clearMission(mission.id)}
                    title="Mark Handled / Clear Card"
                    className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ClosedLostModal
        isOpen={!!closedLostDeal}
        deal={closedLostDeal}
        onClose={() => setClosedLostDeal(null)}
        onSuccess={() => {
          if (closedLostDeal) {
            clearMission(`stalled_${closedLostDeal.id}`);
            clearMission(`action_due_${closedLostDeal.id}`);
            clearMission(`new_${closedLostDeal.id}`);
            clearMission(`aligned_${closedLostDeal.id}`);
          }
          setClosedLostDeal(null);
          onRefreshDeals();
        }}
      />

      <LibertyJModal
        isOpen={!!libertyJModalDeal}
        deal={libertyJModalDeal}
        mode={libertyJModalMode}
        onClose={() => setLibertyJModalDeal(null)}
        onSuccess={() => {
          if (libertyJModalDeal) {
            clearMission(`stalled_${libertyJModalDeal.id}`);
            clearMission(`action_${libertyJModalDeal.id}`);
            clearMission(`new_${libertyJModalDeal.id}`);
          }
          setLibertyJModalDeal(null);
          onRefreshDeals();
        }}
      />
    </div>
  );
}
