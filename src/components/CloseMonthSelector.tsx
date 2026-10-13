'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { 
  getRollingCloseMonths, 
  getCloseMonthKey, 
  formatCloseMonthLabel,
  CloseMonthOption 
} from '@/lib/close-month';

interface CloseMonthSelectorProps {
  dealId: string;
  closeDate: string | null;
  onUpdated?: (newIsoDate: string) => void;
  variant?: 'card' | 'drawer';
}

export function CloseMonthSelector({
  dealId,
  closeDate,
  onUpdated,
  variant = 'card',
}: CloseMonthSelectorProps) {
  const [currentCloseDate, setCurrentCloseDate] = useState<string | null>(closeDate);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCurrentCloseDate(closeDate);
  }, [closeDate]);

  // Generate rolling 18 months options
  const options = useMemo(() => {
    const list = getRollingCloseMonths(18);
    const currentKey = getCloseMonthKey(currentCloseDate);

    // If deal has an existing close date outside the rolling 18 list, prepend it
    if (currentCloseDate && currentKey && !list.some((o) => o.key === currentKey)) {
      const customLabel = formatCloseMonthLabel(currentCloseDate);
      list.unshift({
        key: currentKey,
        label: `${customLabel} (Past)`,
        value: currentCloseDate,
        year: new Date(currentCloseDate).getUTCFullYear(),
        month: new Date(currentCloseDate).getUTCMonth() + 1,
        lastDay: new Date(currentCloseDate).getUTCDate(),
      });
    }

    return list;
  }, [currentCloseDate]);

  // Find selected key
  const selectedKey = getCloseMonthKey(currentCloseDate) || '';

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const selectedIso = e.target.value;
    if (!selectedIso || selectedIso === currentCloseDate) return;

    const prevDate = currentCloseDate;
    // Optimistic update
    setCurrentCloseDate(selectedIso);
    setIsSaving(true);

    try {
      const res = await fetch(`/api/hubspot/deal/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closeDate: selectedIso }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update close date');
      }

      if (onUpdated) {
        onUpdated(selectedIso);
      }
    } catch (err: any) {
      console.error('Failed to update deal close date:', err);
      // Rollback
      setCurrentCloseDate(prevDate);
      alert(`Could not save closing month: ${err.message || 'Network error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (variant === 'drawer') {
    return (
      <div 
        className="flex items-center space-x-1.5 bg-blue-50/80 border border-blue-200 px-2 py-1 rounded-lg shadow-2xs"
        onClick={(e) => e.stopPropagation()}
      >
        <Calendar className="h-3.5 w-3.5 text-blue-600 shrink-0" />
        <span className="text-[10px] font-bold uppercase text-blue-700 tracking-wider shrink-0">
          Close:
        </span>
        <select
          value={options.find((o) => o.key === selectedKey)?.value || ''}
          onChange={handleChange}
          disabled={isSaving}
          className="text-xs font-bold bg-transparent text-blue-900 focus:outline-none cursor-pointer truncate max-w-[130px] sm:max-w-none"
          title="Select expected closing month (pegs close date to the end of month)"
        >
          <option value="" disabled>
            Select Month ▾
          </option>
          {options.map((opt) => (
            <option key={opt.key} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {isSaving && <RefreshCw className="h-3 w-3 text-blue-600 animate-spin shrink-0" />}
      </div>
    );
  }

  // Variant === 'card'
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/90 rounded-md px-1.5 py-0.5 transition shadow-2xs group/month max-w-full"
    >
      <Calendar className="h-3 w-3 text-slate-400 group-hover/month:text-blue-500 shrink-0 transition" />
      <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
        Close:
      </span>
      <select
        value={options.find((o) => o.key === selectedKey)?.value || ''}
        onChange={handleChange}
        disabled={isSaving}
        className="text-[10.5px] font-semibold text-slate-700 group-hover/month:text-blue-700 bg-transparent focus:outline-none cursor-pointer truncate max-w-[110px]"
        title="Select expected closing month (rolling 18 months)"
      >
        <option value="" disabled>
          Set month ▾
        </option>
        {options.map((opt) => (
          <option key={opt.key} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {isSaving && <RefreshCw className="h-2.5 w-2.5 text-blue-500 animate-spin shrink-0" />}
    </div>
  );
}
