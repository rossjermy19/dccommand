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
  Archive
} from 'lucide-react';
import { DealTagBadge } from './DealTagBadge';
import { ClosedLostModal } from './ClosedLostModal';

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
  const [statusFilter, setStatusFilter] = useState<'all' | 'action_due' | 'stalled' | 'new_deal' | 'aligned_story'>('all');

  // Quick Plan date state for in-card scheduling
  const [schedulingDealId, setSchedulingDealId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
  const [closedLostDeal, setClosedLostDeal] = useState<Deal | null>(null);

  // Generate dynamic missions from deals
  const rawMissions = useMemo<MissionItem[]>(() => {
    const list: MissionItem[] = [];

    deals.forEach((deal) => {
      // 1. Stalled deals (Ghosting risk: >7d without contact and no future task)
      if (deal.health === 'urgent') {
        list.push({
          id: `stalled_${deal.id}`,
          deal,
          type: 'stalled',
          title: `No touchpoint in ${deal.daysSinceContact || 7} days`,
          description: `No contact recently and no scheduled next step. Plan a follow-up date or send an email.`,
          urgency: 'high',
        });
      }

      // 2. Action Due (task due today or post-meeting deliverable)
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

      // 3. New Deals (< 14 days old or Meeting Booked)
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

      // 4. Meeting held in last 3 days without Aligned Story saved
      else if (
        (deal.daysSinceContact === 1 || deal.daysSinceContact === 2) &&
        !deal.alignedStoryReady &&
        (deal.stage.includes('presentation') || deal.stageLabel.toLowerCase().includes('held'))
      ) {
        list.push({
          id: `aligned_${deal.id}`,
          deal,
          type: 'aligned_story',
          title: `Meeting held — Aligned Room Story ready`,
          description: `Turn the Fireflies recording for ${deal.name} into the customer-facing Aligned room story.`,
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
      </div>

      {/* Zero State: Celebratory Victory Screen */}
      {unclearedAllMissions.length === 0 ? (
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
    </div>
  );
}
