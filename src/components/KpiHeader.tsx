'use client';

import React from 'react';
import { Clock, ShieldCheck, TrendingUp, CalendarCheck, Filter, X, Star } from 'lucide-react';

interface KpiHeaderProps {
  stats: {
    totalDeals: number;
    totalPipelineValue: number;
    urgentCount?: number;
    warningCount: number;
    healthyCount: number;
    snoozedCount?: number;
    goldCount?: number;
    goldPipelineValue?: number;
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

  const formattedGoldValue = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(stats.goldPipelineValue || 0);

  const toggle = (target: string) => {
    onSelectFilter(filter === target ? 'all' : target);
  };

  return (
    <div className="space-y-3 mb-4 sm:mb-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* 1. Total Active Pipeline */}
        <div 
          onClick={() => onSelectFilter('all')}
          className={`col-span-2 lg:col-span-1 p-3 sm:p-4 rounded-xl border transition cursor-pointer select-none relative group active:scale-[0.99] ${
            filter === 'all'
              ? 'bg-blue-50/50 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider">Active Pipeline</span>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{formattedPipelineValue}</div>
          <div className="flex items-center justify-between mt-1 text-[10.5px] sm:text-[11px] text-slate-500 font-medium">
            <span>{stats.totalDeals} open deals</span>
            {filter === 'all' && (
              <span className="text-[9.5px] sm:text-[10px] text-blue-700 font-bold bg-blue-100/80 px-1.5 py-0.5 rounded">All Shown</span>
            )}
          </div>
        </div>

        {/* 2. Gold VIP Deals (Total Value + Total Number of High-Chance Deals) */}
        <div 
          onClick={() => toggle('gold')}
          className={`p-3 sm:p-4 rounded-xl border transition cursor-pointer select-none relative group active:scale-[0.99] ${
            filter === 'gold'
              ? 'bg-gradient-to-br from-amber-100 via-yellow-100 to-amber-200 border-amber-500 shadow-md ring-2 ring-amber-400/40 text-amber-950'
              : 'bg-gradient-to-br from-amber-50/90 via-yellow-50/60 to-amber-100/50 border-amber-300/90 shadow-2xs hover:border-amber-400 hover:shadow-xs text-amber-950'
          }`}
          title="Click to filter to Gold Deals (High Chance to Close)"
        >
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-[10.5px] sm:text-[11px] font-black uppercase tracking-wider truncate">Gold VIP Deals</span>
            <Star className="h-4 w-4 fill-amber-400 text-amber-500 shrink-0 ml-1" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-950 tracking-tight font-mono">
            {formattedGoldValue}
          </div>
          <div className="flex items-center justify-between mt-1 text-[10.5px] sm:text-[11px] font-medium text-amber-900">
            <span className="font-bold">{stats.goldCount || 0} high chance</span>
            {filter === 'gold' ? (
              <span className="text-[9.5px] sm:text-[10px] text-amber-950 font-black bg-amber-300/90 px-1.5 py-0.5 rounded">Active</span>
            ) : (
              <span className="text-[9.5px] sm:text-[10px] text-amber-800 font-bold bg-amber-200/60 px-1.5 py-0.2 rounded">VIP</span>
            )}
          </div>
        </div>

        {/* 3. Action Due (Touch Required / Due Today) */}
        <div 
          onClick={() => toggle('warning')}
          className={`p-3 sm:p-4 rounded-xl border transition cursor-pointer select-none relative group active:scale-[0.99] ${
            filter === 'warning'
              ? 'bg-amber-50 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 shadow-2xs hover:border-amber-300 hover:bg-amber-50/30'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider truncate">Action Due</span>
            <Clock className="h-4 w-4 text-amber-600 shrink-0 ml-1" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-900 tracking-tight">{stats.warningCount}</div>
          <div className="flex items-center justify-between mt-1 text-[10.5px] sm:text-[11px] font-medium">
            <span className="text-amber-700 truncate">Touch required</span>
            {filter === 'warning' ? (
              <span className="text-[9.5px] sm:text-[10px] text-amber-800 font-bold bg-amber-200/80 px-1.5 py-0.5 rounded">Active</span>
            ) : (
              <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition hidden sm:inline">Filter</span>
            )}
          </div>
        </div>

        {/* 4. Planned (Scheduled Meetings & Future Tasks) */}
        <div 
          onClick={() => toggle('snoozed')}
          className={`p-3 sm:p-4 rounded-xl border transition cursor-pointer select-none relative group active:scale-[0.99] ${
            filter === 'snoozed'
              ? 'bg-indigo-50 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200 shadow-2xs hover:border-indigo-300 hover:bg-indigo-50/30'
          }`}
        >
          <div className="flex items-center justify-between text-indigo-700 mb-1">
            <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider truncate">Planned</span>
            <CalendarCheck className="h-4 w-4 text-indigo-600 shrink-0 ml-1" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-indigo-900 tracking-tight">
            {stats.snoozedCount || 0}
          </div>
          <div className="flex items-center justify-between mt-1 text-[10.5px] sm:text-[11px] font-medium">
            <span className="text-indigo-600 truncate">Scheduled</span>
            {filter === 'snoozed' ? (
              <span className="text-[9.5px] sm:text-[10px] text-indigo-800 font-bold bg-indigo-200/80 px-1.5 py-0.5 rounded">Active</span>
            ) : (
              <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition hidden sm:inline">Filter</span>
            )}
          </div>
        </div>

        {/* 5. In Momentum (Active Healthy Rhythm) */}
        <div 
          onClick={() => toggle('healthy')}
          className={`p-3 sm:p-4 rounded-xl border transition cursor-pointer select-none relative group active:scale-[0.99] ${
            filter === 'healthy'
              ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 shadow-2xs hover:border-emerald-300 hover:bg-emerald-50/30'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider truncate">In Momentum</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 ml-1" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-900 tracking-tight">{stats.healthyCount}</div>
          <div className="flex items-center justify-between mt-1 text-[10.5px] sm:text-[11px] font-medium">
            <span className="text-emerald-700 truncate">Active rhythm</span>
            {filter === 'healthy' ? (
              <span className="text-[9.5px] sm:text-[10px] text-emerald-800 font-bold bg-emerald-200/80 px-1.5 py-0.5 rounded">Active</span>
            ) : (
              <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition hidden sm:inline">Filter</span>
            )}
          </div>
        </div>
      </div>

      {/* Active Filter Banner when filtered */}
      {filter !== 'all' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 shadow-2xs">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="text-[11.5px] sm:text-xs">
              Filter:{' '}
              <strong className="text-blue-950 font-bold">
                {filter === 'gold' && `Gold VIP Deals (${stats.goldCount || 0} high-chance deals · ${formattedGoldValue})`}
                {filter === 'warning' && 'Action Due (deals requiring immediate touchpoint or overdue task)'}
                {filter === 'snoozed' && 'Planned Follow-up (future task or meeting scheduled)'}
                {filter === 'healthy' && 'In Momentum (contacted recently or today)'}
              </strong>
            </span>
          </div>
          <button
            onClick={() => onSelectFilter('all')}
            className="flex items-center space-x-1 font-semibold text-blue-700 hover:text-blue-950 bg-blue-100 hover:bg-blue-200 px-2.5 py-1 rounded-lg transition text-[11px] shrink-0 self-end sm:self-auto"
          >
            <span>Show All Deals</span>
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
