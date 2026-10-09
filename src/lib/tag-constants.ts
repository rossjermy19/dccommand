// Shared constants for Deal Sources and Tags (safe for both client and server)
export interface SourceOption {
  label: string;
  value: string;
  badgeColor?: string;
}

export const SOURCE_OPTIONS: SourceOption[] = [
  { label: 'Back with Liberty J', value: 'Back with Liberty J', badgeColor: 'bg-teal-50 text-teal-800 border-teal-300' },
  { label: 'Liberty J', value: 'Liberty Jai', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { label: 'Partnerships - Evri', value: 'Partnerships - Evri', badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { label: 'Customer Referral', value: 'Customer Refferal', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { label: 'SDR Outbound', value: 'SDR', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  { label: 'Direct', value: 'Direct', badgeColor: 'bg-slate-100 text-slate-700 border-slate-200' },
  { label: 'Shopify', value: 'Orders Shopify', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
  { label: 'Inbound', value: 'Inbound Call', badgeColor: 'bg-teal-50 text-teal-700 border-teal-200' },
  { label: 'Event', value: 'Industry Events', badgeColor: 'bg-pink-50 text-pink-700 border-pink-200' },
];
