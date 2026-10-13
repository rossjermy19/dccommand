'use client';

import React from 'react';
import { Activity, Sparkles, RefreshCw } from 'lucide-react';

interface NavbarProps {
  onOpenTranscriptModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Navbar({ onOpenTranscriptModal, onRefresh, isRefreshing }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-500/20 text-white font-black text-xs sm:text-sm shrink-0">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-extrabold text-sm sm:text-base md:text-lg text-slate-900 tracking-tight truncate">
                DC Command
              </span>
              <span className="hidden sm:inline-block text-[9.5px] uppercase font-bold tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full shrink-0">
                Despatch Cloud
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-500 font-medium truncate">Ross Jermy • Executive Sales Command</p>
            <p className="block sm:hidden text-[10.5px] text-slate-500 font-medium truncate leading-tight">Ross Jermy</p>
          </div>
        </div>

        {/* Status Indicators & Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <div className="hidden md:flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-700 font-semibold">HubSpot Live</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">EU1 Portal</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 px-2.5 sm:px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs transition disabled:opacity-50 min-h-[36px]"
            title="Refresh HubSpot data"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            onClick={onOpenTranscriptModal}
            className="flex items-center space-x-1.5 sm:space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-2.5 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold shadow-sm shadow-blue-500/20 transition active:scale-95 min-h-[36px]"
          >
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white shrink-0" />
            <span className="hidden sm:inline">Analyse Meeting</span>
            <span className="inline sm:hidden">Analyse</span>
          </button>
        </div>
      </div>
    </header>
  );
}
