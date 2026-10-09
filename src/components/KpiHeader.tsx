'use client';

import React from 'react';
import { DollarSign, AlertCircle, Clock, ShieldCheck, TrendingUp, CalendarCheck } from 'lucide-react';

interface KpiHeaderProps {
  stats: {
    totalDeals: number;
    totalPipelineValue: number;
    urgentCount: number;
    warningCount: number;
    healthyCount: number;
    snoozedCount?: number;
  };
  filter: string;
  onSelectFilter: (filter: string) => void;
}

export function KpiHeader({ stats, filter, onSelectFilter }: KpiHeaderProps) {
  const formattedPipelineValue = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(stats.totalPipelineValue);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {/* Total Pipeline */}
      <div 
        onClick={() => onSelectFilter('all')}
        className={`col-span-2 lg:col-span-1 p-4 rounded-xl border transition cursor-pointer ${
          filter === 'all'
            ? 'bg-slate-900 border-blue-500/50 shadow-md shadow-blue-500/10'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Active Pipeline</span>
          <TrendingUp className="h-4 w-4 text-blue-400" />
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">{formattedPipelineValue}</div>
        <p className="text-xs text-slate-400 mt-1">{stats.totalDeals} open deals managed</p>
      </div>

      {/* Critical / True Ghosting (> 7 days AND no task) */}
      <div 
        onClick={() => onSelectFilter('urgent')}
        className={`p-4 rounded-xl border transition cursor-pointer ${
          filter === 'urgent'
            ? 'bg-rose-950/40 border-rose-500/80 shadow-md shadow-rose-500/10'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-rose-900/40'
        }`}
      >
        <div className="flex items-center justify-between text-rose-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Unplanned Stalled</span>
          <AlertCircle className="h-4 w-4 text-rose-400" />
        </div>
        <div className="text-2xl font-bold text-rose-200 tracking-tight">{stats.urgentCount}</div>
        <p className="text-xs text-rose-400/80 mt-1">&gt; 7d & no task scheduled</p>
      </div>

      {/* Warning / Follow-up Due */}
      <div 
        onClick={() => onSelectFilter('warning')}
        className={`p-4 rounded-xl border transition cursor-pointer ${
          filter === 'warning'
            ? 'bg-amber-950/40 border-amber-500/80 shadow-md shadow-amber-500/10'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-amber-900/40'
        }`}
      >
        <div className="flex items-center justify-between text-amber-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Action Due</span>
          <Clock className="h-4 w-4 text-amber-400" />
        </div>
        <div className="text-2xl font-bold text-amber-200 tracking-tight">{stats.warningCount}</div>
        <p className="text-xs text-amber-400/80 mt-1">Due today or post-meeting</p>
      </div>

      {/* Planned Follow-ups / Scheduled */}
      <div 
        onClick={() => onSelectFilter('snoozed')}
        className={`p-4 rounded-xl border transition cursor-pointer ${
          filter === 'snoozed'
            ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md shadow-indigo-500/10'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-indigo-900/40'
        }`}
      >
        <div className="flex items-center justify-between text-indigo-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Planned Follow-up</span>
          <CalendarCheck className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="text-2xl font-bold text-indigo-200 tracking-tight">
          {stats.snoozedCount || 0}
        </div>
        <p className="text-xs text-indigo-400/80 mt-1">Dealt with / task scheduled</p>
      </div>

      {/* Active Rhythm (< 3 days) */}
      <div 
        onClick={() => onSelectFilter('healthy')}
        className={`p-4 rounded-xl border transition cursor-pointer ${
          filter === 'healthy'
            ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md shadow-emerald-500/10'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-emerald-900/40'
        }`}
      >
        <div className="flex items-center justify-between text-emerald-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">In Momentum</span>
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="text-2xl font-bold text-emerald-200 tracking-tight">{stats.healthyCount}</div>
        <p className="text-xs text-emerald-400/80 mt-1">Touched within 3 days</p>
      </div>
    </div>
  );
}
