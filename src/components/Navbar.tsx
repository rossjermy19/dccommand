'use client';

import React from 'react';
import { Activity, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';

interface NavbarProps {
  onOpenTranscriptModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Navbar({ onOpenTranscriptModal, onRefresh, isRefreshing }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0B0F17]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">DC Command Centre</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                Despatch Cloud
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Ross Jermy • Executive Deal Radar</p>
          </div>
        </div>

        {/* Status Indicators & Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="hidden md:flex items-center space-x-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">HubSpot Live</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">EU1 Portal</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-xs font-medium border border-slate-800 transition disabled:opacity-50"
            title="Refresh HubSpot data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            onClick={onOpenTranscriptModal}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-lg shadow-blue-500/25 transition active:scale-95"
          >
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <span>Analyze Meeting</span>
          </button>
        </div>
      </div>
    </header>
  );
}
