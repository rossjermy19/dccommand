'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Tag
} from 'lucide-react';
import { DealTagBadge } from './DealTagBadge';

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
  // Track dismissed/completed mission IDs in local session storage so they vanish immediately
  const [clearedMissionIds, setClearedMissionIds] = useState<Set<string>>(() => new Set());
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  // Quick Plan date state for in-card scheduling
  const [schedulingDealId, setSchedulingDealId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);

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
          description: `Mr. Ross, ${deal.name} is stalled without an agreed next step. Send a nudge or schedule a follow-up date.`,
          urgency: 'high',
        });
      }

      // 2. Action Due (task due today or post-meeting deliverable)
      else if (deal.health === 'warning') {
        list.push({
          id: `action_${deal.id}`,
          deal,
          type: 'action_due',
          title: deal.nextTaskSubject ? `Task due: ${deal.nextTaskSubject}` : `Action due: Meeting held recently`,
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
          title: `✨ Fresh Opportunity Landed`,
          description: `New deal in ${deal.stageLabel}. Review pre-call notes and confirm intro appointment.`,
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
          title: `🎬 Meeting held — Aligned Room Story ready to generate`,
          description: `Turn the Fireflies recording for ${deal.name} into the customer-facing Aligned room story.`,
          urgency: 'medium',
        });
      }
    });

    return list;
  }, [deals]);

  // Filter out cleared missions
  const activeMissions = useMemo(() => {
    return rawMissions.filter((m) => !clearedMissionIds.has(m.id));
  }, [rawMissions, clearedMissionIds]);

  const totalMissions = rawMissions.length;
  const clearedCount = clearedMissionIds.size;
  const completionPercentage = totalMissions > 0 
    ? Math.min(100, Math.round((clearedCount / (clearedCount + activeMissions.length)) * 100))
    : 100;

  // Clear an item with animation
  const clearMission = (missionId: string) => {
    setAnimatingId(missionId);
    setTimeout(() => {
      setClearedMissionIds((prev) => new Set(prev).add(missionId));
      setAnimatingId(null);
    }, 300);
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
    <div className="space-y-6">
      {/* Gamified Header: Daily Mission Score */}
      <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Daily Sales Clear-Desk Mode</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">Ross Jermy</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {activeMissions.length === 0
                ? "🎉 Clean Desk Achieved, Mr. Ross!"
                : `You have ${activeMissions.length} active deal actions today.`}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              {activeMissions.length === 0
                ? "Every single deal has active communication or a confirmed next date. Your pipeline is in 100% momentum."
                : "Act on these priority items to ensure zero dropped balls. Watch each card vanish as you take action."}
            </p>
          </div>

          {/* Gamified Progress Bar Widget */}
          <div className="w-full md:w-72 bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 shrink-0">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-slate-300 flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                <span>Daily Cleared</span>
              </span>
              <span className="font-mono text-emerald-400">{completionPercentage}%</span>
            </div>
            
            {/* Progress bar track */}
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
              <span>{clearedCount} completed</span>
              <span>{activeMissions.length} pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zero State: Celebratory Victory Screen */}
      {activeMissions.length === 0 ? (
        <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-12 text-center space-y-4 shadow-xl">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40">
            <Trophy className="h-8 w-8 text-amber-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Zero Pending Actions!</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
              Outstanding work, Mr. Ross. You&apos;ve cleared your daily queue. All deals are moving forward with active touchpoints or planned dates.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onSwitchToPipelineBoard}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 transition"
            >
              <Kanban className="h-4 w-4" />
              <span>Explore Full Pipeline Board</span>
            </button>
          </div>
        </div>
      ) : (
        /* Action Queue Cards Stream */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Priority Action Items ({activeMissions.length})
            </span>
            <span className="text-[11px] text-slate-500">
              Click action to resolve and clear from dashboard
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {activeMissions.map((mission) => {
              const isAnimating = animatingId === mission.id;
              const formattedAmount = mission.deal.amount
                ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(mission.deal.amount)
                : '£—';

              return (
                <div
                  key={mission.id}
                  className={`bg-slate-900/90 border rounded-2xl p-4 sm:p-5 shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    isAnimating ? 'opacity-0 scale-95 -translate-y-4' : 'opacity-100 scale-100'
                  } ${
                    mission.type === 'stalled'
                      ? 'border-rose-900/60 bg-gradient-to-r from-rose-950/20 via-slate-900 to-slate-900'
                      : mission.type === 'action_due'
                      ? 'border-amber-900/60 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900'
                      : mission.type === 'new_deal'
                      ? 'border-cyan-900/60 bg-gradient-to-r from-cyan-950/20 via-slate-900 to-slate-900'
                      : 'border-purple-900/60 bg-gradient-to-r from-purple-950/20 via-slate-900 to-slate-900'
                  }`}
                >
                  {/* Left Column: Deal Metadata & Issue */}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Urgency Badge */}
                      {mission.type === 'stalled' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-600">
                          <Flame className="h-3 w-3 text-rose-400" />
                          <span>STALLED RISK</span>
                        </span>
                      )}
                      {mission.type === 'action_due' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-600">
                          <Clock className="h-3 w-3 text-amber-400" />
                          <span>ACTION DUE TODAY</span>
                        </span>
                      )}
                      {mission.type === 'new_deal' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-600">
                          <Sparkles className="h-3 w-3 text-cyan-400" />
                          <span>NEW DEAL</span>
                        </span>
                      )}
                      {mission.type === 'aligned_story' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-600">
                          <Sparkles className="h-3 w-3 text-purple-400" />
                          <span>ALIGNED STORY READY</span>
                        </span>
                      )}

                      {/* Origin / Libby Tag */}
                      <DealTagBadge
                        dealId={mission.deal.id}
                        tags={mission.deal.tags}
                        subSource={mission.deal.subSource}
                        onTagUpdated={onRefreshDeals}
                      />

                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {formattedAmount}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        • {mission.deal.stageLabel}
                      </span>
                    </div>

                    {/* Deal Name */}
                    <div className="flex items-center gap-2">
                      <h4
                        onClick={() => onSelectDeal(mission.deal)}
                        className="text-base font-bold text-white hover:text-blue-400 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{mission.deal.name}</span>
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      </h4>
                      <a
                        href={mission.deal.hubspotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-slate-300"
                        title="Open in HubSpot"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    {/* Mission Instruction */}
                    <p className="text-xs text-slate-300 font-medium">
                      {mission.description}
                    </p>
                  </div>

                  {/* Right Column: Resolution Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Resolution Action 1: Post-Call Aligned Story */}
                    {mission.type === 'aligned_story' && (
                      <button
                        onClick={() => {
                          onOpenAlignedModal(mission.deal);
                          clearMission(mission.id);
                        }}
                        className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-purple-600/30 transition"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Generate Aligned Story</span>
                      </button>
                    )}

                    {/* Resolution Action 2: Email Drafter */}
                    <button
                      onClick={() => {
                        onDraftFollowUp(mission.deal);
                        clearMission(mission.id);
                      }}
                      className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-md shadow-blue-600/25 transition"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>Draft Email</span>
                    </button>

                    {/* Resolution Action 3: Quick Plan / Schedule */}
                    {schedulingDealId === mission.deal.id ? (
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-white text-xs px-2 py-1 rounded"
                        />
                        <button
                          onClick={() => handleQuickSchedule(mission.deal, scheduleDate, `Follow-up with ${mission.deal.name}`)}
                          disabled={!scheduleDate || isSubmittingSchedule}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-xs font-bold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setSchedulingDealId(null)}
                          className="text-slate-400 hover:text-white px-1.5 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          // Default date: 7 days from now
                          const d = new Date();
                          d.setDate(d.getDate() + 7);
                          setScheduleDate(d.toISOString().split('T')[0]);
                          setSchedulingDealId(mission.deal.id);
                        }}
                        className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-medium border border-slate-700 transition"
                      >
                        <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Plan Follow-up</span>
                      </button>
                    )}

                    {/* Open Full Notes Drawer */}
                    <button
                      onClick={() => onSelectDeal(mission.deal)}
                      title="View Timeline & Details"
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                    >
                      <FileText className="h-4 w-4" />
                    </button>

                    {/* Quick Dismiss / Done */}
                    <button
                      onClick={() => clearMission(mission.id)}
                      title="Mark Handled / Clear Card"
                      className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
