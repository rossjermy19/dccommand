'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Deal, DealContact, DealNote, DealTask, DealEmail } from '@/lib/types';
import { 
  X, 
  ExternalLink, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  FileText, 
  Users, 
  CheckSquare, 
  Mail, 
  Phone, 
  Send, 
  AlertCircle,
  Sparkles,
  ChevronRight,
  Inbox
} from 'lucide-react';

interface DealDrawerProps {
  deal: Deal | null;
  onClose: () => void;
  onOpenAnalysis: (deal: Deal) => void;
  onDraftFollowUp: (deal: Deal) => void;
  onRefreshDeals: () => void;
}

export function DealDrawer({
  deal,
  onClose,
  onOpenAnalysis,
  onDraftFollowUp,
  onRefreshDeals,
}: DealDrawerProps) {
  const [activeTab, setActiveTab] = useState<'notes' | 'tasks' | 'contacts'>('notes');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<DealNote[]>([]);
  const [tasks, setTasks] = useState<DealTask[]>([]);
  const [contacts, setContacts] = useState<DealContact[]>([]);
  const [emails, setEmails] = useState<DealEmail[]>([]);
  const [error, setError] = useState<string | null>(null);

  // New Note Form
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteBody, setNewNoteBody] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // New Task Form
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskSubject, setTaskSubject] = useState('');
  const [taskBody, setTaskBody] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH');
  const [isSavingTask, setIsSavingTask] = useState(false);

  useEffect(() => {
    if (!deal) return;
    fetchDetails(deal.id);
  }, [deal]);

  const fetchDetails = async (dealId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/hubspot/deal/${dealId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setNotes(data.notes || []);
      setTasks(data.tasks || []);
      setContacts(data.contacts || []);
      setEmails(data.emails || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load deal details');
    } finally {
      setLoading(false);
    }
  };

  const timelineItems = useMemo(() => {
    const combined = [
      ...notes.map((n) => ({
        id: n.id,
        type: 'note' as const,
        body: n.body,
        timestamp: n.timestamp,
      })),
      ...emails.map((e) => ({
        id: e.id,
        type: 'email' as const,
        subject: e.subject,
        body: e.body || '',
        direction: e.direction,
        timestamp: e.timestamp,
      })),
    ];
    return combined.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [notes, emails]);

  if (!deal) return null;

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteBody.trim()) return;

    setIsSavingNote(true);
    try {
      const res = await fetch('/api/hubspot/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.id, noteBody: newNoteBody }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setNewNoteBody('');
      setShowAddNote(false);
      fetchDetails(deal.id);
      onRefreshDeals();
    } catch (err: any) {
      alert(`Failed to save note: ${err.message}`);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskSubject.trim() || !taskDueDate) {
      alert('Please provide a task subject and due date.');
      return;
    }

    setIsSavingTask(true);
    try {
      const res = await fetch('/api/hubspot/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          subject: taskSubject,
          body: taskBody,
          dueDate: taskDueDate,
          priority: taskPriority,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setTaskSubject('');
      setTaskBody('');
      setTaskDueDate('');
      setShowAddTask(false);
      fetchDetails(deal.id);
      onRefreshDeals();
    } catch (err: any) {
      alert(`Failed to create task: ${err.message}`);
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleToggleTaskStatus = async (task: DealTask) => {
    const nextStatus = task.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );

      const res = await fetch('/api/hubspot/task', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, status: nextStatus }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
    } catch (err: any) {
      alert(`Failed to update task: ${err.message}`);
      fetchDetails(deal.id);
    }
  };

  const formattedAmount = deal.amount
    ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(deal.amount)
    : '—';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-[#0F172A] border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {deal.stageLabel}
                </span>
                <span className="text-sm font-mono font-bold text-emerald-400">
                  {formattedAmount}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1.5 leading-snug">
                {deal.name}
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              <a
                href={deal.hubspotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="View in HubSpot CRM"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Quick Action Pills */}
          <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-slate-800/80">
            <button
              onClick={() => onOpenAnalysis(deal)}
              className="flex items-center space-x-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3 py-1.5 rounded-lg transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Analyze Meeting</span>
            </button>
            <button
              onClick={() => onDraftFollowUp(deal)}
              className="flex items-center space-x-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg shadow-sm shadow-blue-500/25 transition"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Draft Follow-up</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6">
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'notes'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Activity Timeline ({timelineItems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'tasks'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Tasks ({tasks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'contacts'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Contacts ({contacts.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Loading notes & tasks from HubSpot...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          ) : (
            <>
              {/* TIMELINE TAB (NOTES & EMAILS) */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Timeline ({timelineItems.length}) • Notes & Emails
                    </span>
                    <button
                      onClick={() => setShowAddNote(!showAddNote)}
                      className="flex items-center space-x-1 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{showAddNote ? 'Cancel' : 'Add Note'}</span>
                    </button>
                  </div>

                  {/* Add Note Form */}
                  {showAddNote && (
                    <form onSubmit={handleCreateNote} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                      <textarea
                        rows={4}
                        value={newNoteBody}
                        onChange={(e) => setNewNoteBody(e.target.value)}
                        placeholder="Write a meeting note, discussion summary, or update..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSavingNote}
                          className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
                        >
                          <Send className="h-3 w-3" />
                          <span>{isSavingNote ? 'Saving to HubSpot...' : 'Save Note to Deal'}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Timeline Items List */}
                  {timelineItems.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No activity recorded on this deal yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {timelineItems.map((item) => {
                        const dateFormatted = new Date(item.timestamp).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        const isEmail = item.type === 'email';

                        return (
                          <div
                            key={item.id}
                            className={`p-4 rounded-xl border text-xs space-y-2 ${
                              isEmail
                                ? 'bg-blue-950/20 border-blue-900/40'
                                : 'bg-slate-900/70 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span
                                className={`font-semibold flex items-center space-x-1.5 ${
                                  isEmail ? 'text-blue-400' : 'text-slate-300'
                                }`}
                              >
                                {isEmail ? (
                                  <>
                                    <Mail className="h-3.5 w-3.5" />
                                    <span>Email: {item.subject || 'Logged Email'}</span>
                                  </>
                                ) : (
                                  <>
                                    <FileText className="h-3.5 w-3.5" />
                                    <span>Note</span>
                                  </>
                                )}
                              </span>
                              <span>{dateFormatted}</span>
                            </div>
                            <div
                              className="text-slate-200 leading-relaxed break-words whitespace-pre-wrap font-sans"
                              dangerouslySetInnerHTML={{ __html: item.body }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TASKS TAB */}
              {activeTab === 'tasks' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Tasks & Follow-ups ({tasks.length})
                    </span>
                    <button
                      onClick={() => setShowAddTask(!showAddTask)}
                      className="flex items-center space-x-1 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{showAddTask ? 'Cancel' : 'Create Task'}</span>
                    </button>
                  </div>

                  {/* Add Task Form */}
                  {showAddTask && (
                    <form onSubmit={handleCreateTask} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                          Task Title
                        </label>
                        <input
                          type="text"
                          value={taskSubject}
                          onChange={(e) => setTaskSubject(e.target.value)}
                          placeholder="e.g. Follow up with Kevin in January regarding parcel splitting"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                            Due Date
                          </label>
                          <input
                            type="date"
                            value={taskDueDate}
                            onChange={(e) => setTaskDueDate(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                            Priority
                          </label>
                          <select
                            value={taskPriority}
                            onChange={(e) => setTaskPriority(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="HIGH">High Priority</option>
                            <option value="MEDIUM">Medium Priority</option>
                            <option value="LOW">Low Priority</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                          Notes / Context (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={taskBody}
                          onChange={(e) => setTaskBody(e.target.value)}
                          placeholder="Additional context or notes..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={isSavingTask}
                          className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
                        >
                          <CheckSquare className="h-3.5 w-3.5" />
                          <span>{isSavingTask ? 'Creating...' : 'Create Task in HubSpot'}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Tasks List */}
                  {tasks.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No tasks scheduled for this deal.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {tasks.map((task) => {
                        const isCompleted = task.status === 'COMPLETED';
                        const dueDateStr = task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'No due date';

                        return (
                          <div
                            key={task.id}
                            className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 transition ${
                              isCompleted
                                ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
                                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <button
                                onClick={() => handleToggleTaskStatus(task)}
                                className="mt-0.5 text-slate-400 hover:text-emerald-400 transition"
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                ) : (
                                  <Circle className="h-4 w-4" />
                                )}
                              </button>
                              <div>
                                <h4
                                  className={`text-xs font-semibold ${
                                    isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                                  }`}
                                >
                                  {task.subject}
                                </h4>
                                {task.body && (
                                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                    {task.body}
                                  </p>
                                )}
                                <div className="flex items-center space-x-2 mt-2 text-[10px] text-slate-400">
                                  <span className="flex items-center space-x-1">
                                    <Calendar className="h-3 w-3 text-blue-400" />
                                    <span>Due: {dueDateStr}</span>
                                  </span>
                                  <span className="text-slate-600">•</span>
                                  <span
                                    className={`font-semibold ${
                                      task.priority === 'HIGH'
                                        ? 'text-rose-400'
                                        : task.priority === 'MEDIUM'
                                        ? 'text-amber-400'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    {task.priority} Priority
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* CONTACTS TAB */}
              {activeTab === 'contacts' && (
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Associated Stakeholders ({contacts.length})
                  </span>

                  {contacts.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No contacts linked to this deal in HubSpot.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contacts.map((c) => (
                        <div
                          key={c.id}
                          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-white text-sm">
                                {c.firstName} {c.lastName}
                              </h4>
                              {c.jobTitle && (
                                <p className="text-[11px] text-slate-400 mt-0.5">{c.jobTitle}</p>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 flex flex-col sm:flex-row gap-2 border-t border-slate-800/80">
                            {c.email && (
                              <a
                                href={`mailto:${c.email}`}
                                className="flex items-center space-x-1.5 text-blue-400 hover:text-blue-300 text-xs"
                              >
                                <Mail className="h-3.5 w-3.5" />
                                <span>{c.email}</span>
                              </a>
                            )}
                            {c.phone && (
                              <a
                                href={`tel:${c.phone}`}
                                className="flex items-center space-x-1.5 text-emerald-400 hover:text-emerald-300 text-xs"
                              >
                                <Phone className="h-3.5 w-3.5" />
                                <span>{c.phone}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
