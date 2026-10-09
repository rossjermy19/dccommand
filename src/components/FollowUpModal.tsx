'use client';

import React, { useState, useEffect } from 'react';
import { Deal, DealContact } from '@/lib/types';
import { X, Mail, Copy, Check, Send, ExternalLink, User } from 'lucide-react';

interface FollowUpModalProps {
  deal: Deal | null;
  onClose: () => void;
  onLogNote: (dealId: string, note: string) => Promise<void>;
}

export function FollowUpModal({ deal, onClose, onLogNote }: FollowUpModalProps) {
  if (!deal) return null;

  const [copied, setCopied] = useState(false);
  const [logging, setLogging] = useState(false);
  const [logged, setLogged] = useState(false);
  const [contacts, setContacts] = useState<DealContact[]>(deal.associatedContacts || []);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [customEmail, setCustomEmail] = useState<string>('');
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Fetch associated contacts from HubSpot if not already in deal object
  useEffect(() => {
    if (deal.id && (!deal.associatedContacts || deal.associatedContacts.length === 0)) {
      setLoadingContacts(true);
      fetch(`/api/hubspot/deal/${deal.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.contacts) {
            setContacts(data.contacts);
            if (data.contacts.length > 0) {
              setSelectedContactId(data.contacts[0].id);
            }
          }
        })
        .catch((e) => console.warn('Could not fetch contacts:', e))
        .finally(() => setLoadingContacts(false));
    } else if (deal.associatedContacts && deal.associatedContacts.length > 0) {
      setContacts(deal.associatedContacts);
      setSelectedContactId(deal.associatedContacts[0].id);
    }
  }, [deal.id]);

  const selectedContact = contacts.find((c) => c.id === selectedContactId);
  const recipientEmail = selectedContact?.email || customEmail;
  const prospectName = selectedContact?.firstName || deal.name.split('-')[0].trim();
  
  // Smart dynamic follow up template tailored for Despatch Cloud
  const isPostMeeting = deal.stage === 'presentationscheduled' || deal.stage === '1209215206';
  const defaultSubject = isPostMeeting
    ? `Despatch Cloud - Following up on our discussion (${deal.name.split('-')[0].trim()})`
    : `Checking in - Despatch Cloud & ${deal.name.split('-')[0].trim()}`;

  const defaultBody = isPostMeeting
    ? `Hi ${prospectName},\n\nI wanted to follow up following our recent discussion regarding your shipping and fulfillment operations.\n\nHave you had the opportunity to review the points we covered around Despatch Cloud's integration capabilities?\n\nHappy to jump on a quick 10-minute touchpoint this week to answer any questions or share the commercial proposal.\n\nBest regards,\nRoss Jermy\nDespatch Cloud`
    : `Hi ${prospectName},\n\nI hope you're having a productive week.\n\nI'm following up on our active thread regarding Despatch Cloud. Given your current order volumes and carrier setup, I wanted to check whether you've had a chance to evaluate the next steps for your operations.\n\nLet me know what day works best for a brief catch-up.\n\nBest regards,\nRoss Jermy\nDespatch Cloud`;

  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyAndOpenHubSpot = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    window.open(deal.hubspotUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenInOutlook = () => {
    const to = recipientEmail ? encodeURIComponent(recipientEmail) : '';
    const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleLogEmailToHubspot = async () => {
    setLogging(true);
    try {
      const res = await fetch('/api/hubspot/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          subject,
          body,
          contactId: selectedContactId || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setLogged(true);
    } catch (e: any) {
      alert(`Failed to log email to HubSpot: ${e.message}`);
    } finally {
      setLogging(false);
    }
  };

  const handleSendAndLog = async () => {
    handleOpenInOutlook();
    await handleLogEmailToHubspot();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Email & Follow-Up Drafter</h2>
              <p className="text-xs text-slate-500">
                Connected to <strong className="text-slate-700">{deal.name}</strong> ({deal.stageLabel})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Recipient Contact Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                <User className="h-3.5 w-3.5 text-blue-600" />
                <span>Recipient Contact (from HubSpot Deal)</span>
              </label>
              {loadingContacts && <span className="text-[11px] text-slate-400">Loading contacts...</span>}
            </div>

            {contacts.length > 0 ? (
              <div className="space-y-1.5">
                <select
                  value={selectedContactId}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
                >
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} {c.email ? `<${c.email}>` : '(No email stored)'} {c.jobTitle ? `— ${c.jobTitle}` : ''}
                    </option>
                  ))}
                  <option value="">Other / Enter manual email...</option>
                </select>

                {!selectedContactId && (
                  <input
                    type="email"
                    placeholder="Enter recipient email (e.g. name@company.com)..."
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <input
                  type="email"
                  placeholder="No contacts linked to this deal yet. Enter recipient email..."
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Email Body
            </label>
            <textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 font-sans leading-relaxed"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={handleCopy}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>

              <button
                onClick={handleCopyAndOpenHubSpot}
                className="flex items-center justify-center space-x-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs"
                title="Copies draft email to clipboard and opens the deal record directly in HubSpot CRM"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Copy & Open in HubSpot</span>
              </button>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleLogEmailToHubspot}
                disabled={logging || logged}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition disabled:opacity-60"
                title="Log this email draft as an engagement record in HubSpot CRM"
              >
                <Send className="h-3.5 w-3.5 text-blue-600" />
                <span>{logged ? 'Logged to HubSpot' : logging ? 'Logging...' : 'Log to HubSpot'}</span>
              </button>

              <button
                onClick={handleSendAndLog}
                disabled={logging}
                className="flex items-center justify-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold px-3 py-2 rounded-xl transition"
                title="Opens in desktop mail client (Outlook/Mail)"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Outlook Mailto</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
