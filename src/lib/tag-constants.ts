// Shared constants for Deal Sources and Tags (safe for both client and server)
export interface SourceOption {
  label: string;
  value: string;
  badgeColor?: string;
}

export const SOURCE_OPTIONS: SourceOption[] = [
  { label: 'Libby', value: 'Liberty Jai', badgeColor: 'bg-purple-900/40 text-purple-300 border-purple-500/40' },
  { label: 'Partnerships - Evri', value: 'Partnerships - Evri', badgeColor: 'bg-cyan-900/40 text-cyan-300 border-cyan-500/40' },
  { label: 'Customer Referral', value: 'Customer Refferal', badgeColor: 'bg-emerald-900/40 text-emerald-300 border-emerald-500/40' },
  { label: 'SDR Outbound', value: 'SDR', badgeColor: 'bg-blue-900/40 text-blue-300 border-blue-500/40' },
  { label: 'Direct', value: 'Direct', badgeColor: 'bg-slate-800 text-slate-300 border-slate-700' },
  { label: 'Shopify', value: 'Orders Shopify', badgeColor: 'bg-amber-900/40 text-amber-300 border-amber-500/40' },
  { label: 'Inbound', value: 'Inbound Call', badgeColor: 'bg-teal-900/40 text-teal-300 border-teal-500/40' },
  { label: 'Event', value: 'Industry Events', badgeColor: 'bg-pink-900/40 text-pink-300 border-pink-500/40' },
];
