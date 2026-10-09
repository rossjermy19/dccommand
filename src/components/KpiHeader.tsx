'use client';

import React from 'react';
import { AlertCircle, Clock, ShieldCheck, TrendingUp, CalendarCheck, Filter, X } from 'lucide-react';

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

  const toggle = (target: string) => {
    onSelectFilter(filter === target ? 'all' : target);
  };

  return (
    <div className="space-y-3 mb-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Pipeline */}
        <div 
          onClick={() => onSelectFilter('all')}
          className={`col-span-2 lg:col-span-1 p-3.5 sm:p-4 rounded-xl border transition cursor-pointer select-none relative group ${
            filter === 'all'
              ? 'bg-slate-900 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/50'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Pipeline</span>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">{formattedPipelineValue}</div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
            <span>{stats.totalDeals} open deals</span>
            {filter === 'all' && (
              <span className="text-[10px] text-blue-400 font-semibold bg-blue-500/10 px-1.5 py-0.5 rounded">All Shown</span>
            )}
          </div>
        </div>

        {/* Critical / True Ghosting (> 7 days AND no task) */}
        <div 
          onClick={() => toggle('urgent')}
          className={`p-3.5 sm:p-4 rounded-xl border transition cursor-pointer select-none relative group ${
            filter === 'urgent'
              ? 'bg-rose-950/50 border-rose-500 shadow-lg shadow-rose-500/20 ring-1 ring-rose-500'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-rose-900/60 hover:bg-rose-950/20'
          }`}
        >
          <div className="flex items-center justify-between text-rose-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Unplanned Stalled</span>
            <AlertCircle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-200 tracking-tight">{stats.urgentCount}</div>
          <div className="flex items-center justify-between mt-1 text-[11px]">
            <span className="text-rose-400/80">&gt; 7d & no task</span>
            {filter === 'urgent' ? (
              <span className="text-[10px] text-rose-300 font-bold bg-rose-500/20 px-1.5 py-0.5 rounded">Filtering</span>
            ) : (
              <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition">Filter</span>
            )}
          </div>
        </div>

        {/* Warning / Follow-up Due */}
        <div 
          onClick={() => toggle('warning')}
          className={`p-3.5 sm:p-4 rounded-xl border transition cursor-pointer select-none relative group ${
            filter === 'warning'
              ? 'bg-amber-950/50 border-amber-500 shadow-lg shadow-amber-500/20 ring-1 ring-amber-500'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-amber-900/60 hover:bg-amber-950/20'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Action Due</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-200 tracking-tight">{stats.warningCount}</div>
          <div className="flex items-center justify-between mt-1 text-[11px]">
            <span className="text-amber-400/80">Due today or touch due</span>
            {filter === 'warning' ? (
              <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-1.5 py-0.5 rounded">Filtering</span>
            ) : (
              <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition">Filter</span>
            )}
          </div>
        </div>

        {/* Planned Follow-ups / Scheduled */}
        <div 
          onClick={() => toggle('snoozed')}
          className={`p-3.5 sm:p-4 rounded-xl border transition cursor-pointer select-none relative group ${
            filter === 'snoozed'
              ? 'bg-indigo-950/50 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-indigo-900/60 hover:bg-indigo-950/20'
          }`}
        >
          <div className="flex items-center justify-between text-indigo-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Planned Follow-up</span>
            <CalendarCheck className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-indigo-200 tracking-tight">
            {stats.snoozedCount || 0}
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px]">
            <span className="text-indigo-400/80">Scheduled task</span>
            {filter === 'snoozed' ? (
              <span className="text-[10px] text-indigo-300 font-bold bg-indigo-500/20 px-1.5 py-0.5 rounded">Filtering</span>
            ) : (
              <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition">Filter</span>
            )}
          </div>
        </div>

        {/* Active Rhythm (< 3 days) */}
        <div 
          onClick={() => toggle('healthy')}
          className={`p-3.5 sm:p-4 rounded-xl border transition cursor-pointer select-none relative group ${
            filter === 'healthy'
              ? 'bg-emerald-950/50 border-emerald-500 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-emerald-900/60 hover:bg-emerald-950/20'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">In Momentum</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-200 tracking-tight">{stats.healthyCount}</div>
          <div className="flex items-center justify-between mt-1 text-[11px]">
            <span className="text-emerald-400/80">Touched &lt; 3d / today</span>
            {filter === 'healthy' ? (
              <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded">Filtering</span>
            ) : (
              <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition">Filter</span>
            )}
          </div>
        </div>
      </div>

      {/* Active Filter Banner when filtered */}
      {filter !== 'all' && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200">
          <div className="flex items-center space-x-2">
            <Filter className="h-3.5 w-3.5 text-blue-400" />
            <span>
              Active Filter:{' '}
              <strong className="text-white capitalize">
                {filter === 'urgent' && 'Unplanned Stalled (> 7d, no task scheduled)'}
                {filter === 'warning' && 'Action Due (due today or follow-up needed)'}
                {filter === 'snoozed' && 'Planned Follow-up (future task scheduled)'}
                {filter === 'healthy' && 'In Momentum (contacted within 3 days or today)'}
              </strong>
            </span>
          </div>
          <button
            onClick={() => onSelectFilter('all')}
            className="flex items-center space-x-1 hover:text-white bg-blue-500/20 hover:bg-blue-500/30 px-2 py-0.5 rounded transition text-[11px]"
          >
            <span>Show All Deals</span>
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
