import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DC Command Centre | Ross Jermy',
  description: 'Executive Deal Command & Intelligence Radar for Despatch Cloud',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0B0F17] text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
