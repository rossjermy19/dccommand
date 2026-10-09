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
    <div className="space-y-3 mb-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Pipeline */}
        <div 
          onClick={() => onSelectFilter('all')}
          className={`col-span-2 lg:col-span-1 p-3.5 sm:p-4 rounded-xl border transition cursor-pointer select-none relative group ${
            filter === 'all'
              ? 'bg-blue-50/50 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Pipeline</span>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{formattedPipelineValue}</div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 font-medium">
            <span>{stats.totalDeals} open deals</span>
            {filter === 'all' && (
              <span className="text-[10px] text-blue-700 font-bold bg-blue-100/80 px-1.5 py-0.5 rounded">All Shown</span>
            )}
          </div>
        </div>

        {/* Critical / True Ghosting (> 7 days AND no task) */}
        <div 
          onClick={() => toggle('urgent')}
          className={`p-3.5 sm:p-4 rounded-xl border transition cursor-pointer select-none relative group ${
            filter === 'urgent'
              ? 'bg-rose-50 border-rose-500 shadow-sm ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200 shadow-2xs hover:border-rose-300 hover:bg-rose-50/30'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Unplanned Stalled</span>
            <AlertCircle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-900 tracking-tight">{stats.urgentCount}</div>
          <div className="flex items-center justify-between mt-1 text-[11px] font-medium">
            <span className="text-rose-600">&gt; 7d & no task</span>
            {filter === 'urgent' ? (
              <span className="text-[10px] text-rose-800 font-bold bg-rose-200/80 px-1.5 py-0.5 rounded">Filtering</span>
            ) : (
              <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition">Filter</span>
            )}
          </div>
        </div>

        {/* Warning / Follow-up Due */}
        <div 
          onClick={() => toggle('warning')}
          className={`p-3.5 sm:p-4 rounded-xl border transition cursor-pointer select-none relative group ${
            filter === 'warning'
              ? 'bg-amber-50 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 shadow-2xs hover:border-amber-300 hover:bg-amber-50/30'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Action Due</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900 tracking-tight">{stats.warningCount}</div>
          <div className="flex items-center justify-between mt-1 text-[11px] font-medium">
            <span className="text-amber-700">Due today or touch due</span>
            {filter === 'warning' ? (
              <span className="text-[10px] text-amber-800 font-bold bg-amber-200/80 px-1.5 py-0.5 rounded">Filtering</span>
            ) : (
              <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition">Filter</span>
            )}
          </div>
        </div>

        {/* Planned Follow-ups / Scheduled */}
        <div 
          onClick={() => toggle('snoozed')}
          className={`p-3.5 sm:p-4 rounded-xl border transition cursor-pointer select-none relative group ${
            filter === 'snoozed'
              ? 'bg-indigo-50 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200 shadow-2xs hover:border-indigo-300 hover:bg-indigo-50/30'
          }`}
        >
          <div className="flex items-center justify-between text-indigo-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Planned Follow-up</span>
            <CalendarCheck className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-900 tracking-tight">
            {stats.snoozedCount || 0}
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px] font-medium">
            <span className="text-indigo-600">Scheduled task</span>
            {filter === 'snoozed' ? (
              <span className="text-[10px] text-indigo-800 font-bold bg-indigo-200/80 px-1.5 py-0.5 rounded">Filtering</span>
            ) : (
              <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition">Filter</span>
            )}
          </div>
        </div>

        {/* Active Rhythm (< 3 days) */}
        <div 
          onClick={() => toggle('healthy')}
          className={`p-3.5 sm:p-4 rounded-xl border transition cursor-pointer select-none relative group ${
            filter === 'healthy'
              ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 shadow-2xs hover:border-emerald-300 hover:bg-emerald-50/30'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">In Momentum</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-900 tracking-tight">{stats.healthyCount}</div>
          <div className="flex items-center justify-between mt-1 text-[11px] font-medium">
            <span className="text-emerald-700">Touched &lt; 3d / today</span>
            {filter === 'healthy' ? (
              <span className="text-[10px] text-emerald-800 font-bold bg-emerald-200/80 px-1.5 py-0.5 rounded">Filtering</span>
            ) : (
              <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition">Filter</span>
            )}
          </div>
        </div>
      </div>

      {/* Active Filter Banner when filtered */}
      {filter !== 'all' && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 shadow-2xs">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-blue-600" />
            <span>
              Active Filter:{' '}
              <strong className="text-blue-950 font-bold capitalize">
                {filter === 'urgent' && 'Unplanned Stalled (> 7d without scheduled task)'}
                {filter === 'warning' && 'Action Due (due today or follow-up needed)'}
                {filter === 'snoozed' && 'Planned Follow-up (future task scheduled)'}
                {filter === 'healthy' && 'In Momentum (contacted within 3 days or today)'}
              </strong>
            </span>
          </div>
          <button
            onClick={() => onSelectFilter('all')}
            className="flex items-center space-x-1 font-semibold text-blue-700 hover:text-blue-950 bg-blue-100 hover:bg-blue-200 px-2.5 py-1 rounded-lg transition text-[11px]"
          >
            <span>Show All Deals</span>
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
