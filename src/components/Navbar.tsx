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
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-500/20 text-white font-black text-sm">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">DC Command Centre</span>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                Despatch Cloud
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Ross Jermy • Executive Sales Command</p>
          </div>
        </div>

        {/* Status Indicators & Actions */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
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
            className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs transition disabled:opacity-50"
            title="Refresh HubSpot data"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            onClick={onOpenTranscriptModal}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold shadow-sm shadow-blue-500/20 transition active:scale-95"
          >
            <Sparkles className="h-4 w-4 text-white" />
            <span>Analyze Meeting</span>
          </button>
        </div>
      </div>
    </header>
  );
}
