'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Tag, Plus, Check, Sparkles, X } from 'lucide-react';
import { SOURCE_OPTIONS } from '@/lib/tag-constants';

interface DealTagBadgeProps {
  dealId: string;
  tags?: string[];
  subSource?: string | null;
  onTagUpdated?: () => void;
}

export function DealTagBadge({ dealId, tags = [], subSource, onTagUpdated }: DealTagBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

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
      if (data.success && onTagUpdated) {
        onTagUpdated();
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
  const isLibertyJ = displayTags.some((t) => /liberty/i.test(t) || /libby/i.test(t)) || /liberty|libby/i.test(subSource || '');

  return (
    <div className="relative inline-flex items-center gap-1.5 flex-wrap">
      {/* Liberty J tag prominent display */}
      {isLibertyJ ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
          Liberty J
        </span>
      ) : null}

      {/* Other tags */}
      {displayTags
        .filter((t) => !/liberty/i.test(t) && !/libby/i.test(t))
        .map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[130px]"
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
        title="Add or update deal source tag"
        className="inline-flex items-center justify-center h-4.5 w-4.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
      >
        <Plus className="h-3 w-3" />
      </button>

      {/* Popover Dropdown (Light Theme) */}
      {isOpen && (
        <div
          ref={popoverRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 left-0 top-6 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-3 space-y-2 text-xs"
        >
          <div className="flex items-center justify-between text-slate-800 font-bold border-b border-slate-100 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-blue-600" />
              <span>Deal Source / Tag</span>
            </span>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quick Presets</p>
            {/* Quick 1-click preset for Liberty J */}
            <button
              onClick={() => handleApplyTag('Liberty J')}
              disabled={isSubmitting}
              className="w-full text-left px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 font-semibold flex items-center justify-between transition"
            >
              <span>Liberty J</span>
              {isLibertyJ && <Check className="h-3.5 w-3.5 text-indigo-600" />}
            </button>

            {/* Other Presets */}
            {SOURCE_OPTIONS.filter((o) => o.label !== 'Liberty J').slice(0, 4).map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleApplyTag(opt.label)}
                disabled={isSubmitting}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-slate-900 flex items-center justify-between transition border border-transparent hover:border-slate-200"
              >
                <span>{opt.label}</span>
                {displayTags.includes(opt.label) && <Check className="h-3.5 w-3.5 text-blue-600" />}
              </button>
            ))}
          </div>

          {/* Custom tag input */}
          <div className="pt-1.5 border-t border-slate-100">
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Or type custom tag..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyTag(customInput);
                }}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
              <button
                onClick={() => handleApplyTag(customInput)}
                disabled={!customInput.trim() || isSubmitting}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg font-bold text-xs transition shadow-xs"
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
