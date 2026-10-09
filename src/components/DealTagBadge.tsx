'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Tag, Plus, Check, Sparkles, X } from 'lucide-react';
import { SOURCE_OPTIONS } from '@/lib/tag-constants';

interface DealTagBadgeProps {
  dealId: string;
  tags?: string[];
  subSource?: string | null;
  onTagUpdated?: (newTag: string) => void;
}

export function DealTagBadge({ dealId, tags = [], subSource, onTagUpdated }: DealTagBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleApplyTag = async (tag: string) => {
    if (!tag.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/hubspot/deal/${dealId}/tag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: tag.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        if (onTagUpdated) onTagUpdated(tag.trim());
      }
    } catch (err) {
      console.error('Failed to update deal tag:', err);
    } finally {
      setIsSubmitting(false);
      setIsOpen(false);
      setCustomInput('');
    }
  };

  // Distinct tags to display
  const displayTags = Array.from(new Set(tags.filter(Boolean)));
  const isLibby = displayTags.some((t) => /libby|liberty/i.test(t)) || /libby|liberty/i.test(subSource || '');

  return (
    <div className="relative inline-flex items-center gap-1.5 flex-wrap">
      {/* Libby tag prominent display */}
      {isLibby ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-950/70 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-900/30">
          <span className="text-amber-400 mr-1 text-[10px]">★</span> Libby
        </span>
      ) : null}

      {/* Other tags */}
      {displayTags
        .filter((t) => !/libby|liberty/i.test(t))
        .map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700 truncate max-w-[120px]"
            title={tag}
          >
            {tag}
          </span>
        ))}

      {/* Add / Edit Tag Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title="Add or update deal source/tag"
        className="inline-flex items-center justify-center h-4 w-4 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
      >
        <Plus className="h-3 w-3" />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          ref={popoverRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 left-0 top-6 w-60 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2.5 space-y-2 text-xs"
        >
          <div className="flex items-center justify-between text-slate-300 font-semibold border-b border-slate-800 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-blue-400" />
              <span>Deal Source / Tag</span>
            </span>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-300">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Quick Presets</p>
            {/* Quick 1-click preset for Libby */}
            <button
              onClick={() => handleApplyTag('Libby')}
              disabled={isSubmitting}
              className="w-full text-left px-2 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-200 font-medium flex items-center justify-between transition"
            >
              <span className="flex items-center gap-1">
                <span className="text-amber-400">★</span> Libby (Liberty Jai)
              </span>
              {isLibby && <Check className="h-3.5 w-3.5 text-purple-400" />}
            </button>

            {/* Other Presets */}
            {SOURCE_OPTIONS.filter((o) => o.label !== 'Libby').slice(0, 4).map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleApplyTag(opt.label)}
                disabled={isSubmitting}
                className="w-full text-left px-2 py-1 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between transition"
              >
                <span>{opt.label}</span>
                {displayTags.includes(opt.label) && <Check className="h-3 w-3 text-blue-400" />}
              </button>
            ))}
          </div>

          {/* Custom tag input */}
          <div className="pt-1 border-t border-slate-800">
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Or type custom tag..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyTag(customInput);
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => handleApplyTag(customInput)}
                disabled={!customInput.trim() || isSubmitting}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded font-medium text-xs transition"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
