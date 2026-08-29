import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Providers } from './providers';
import { Sidebar } from '@/components/shared/Sidebar';
import { Toaster } from 'sonner';
import { GlobalAlerts } from '@/components/shared/GlobalAlerts';

export const metadata: Metadata = {
  title: 'Meridian — Urban Heat Intelligence',
  description: 'Autonomous AI agent monitoring hyperlocal urban heat using FortyGuard Temperature API. Real-time risk analysis and government advisories.',
  keywords: ['heat intelligence', 'urban heat', 'AI agent', 'FortyGuard', 'climate', 'temperature'],
  openGraph: {
    title: 'Meridian — Urban Heat Intelligence',
    description: 'Know your city\'s heat.',
    type: 'website',
  },
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
      </head>
      <body className="bg-base text-primary font-sans antialiased" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <Providers>
          <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
            <Sidebar />
            <main style={{ flex: 1, overflow: 'auto', backgroundColor: 'var(--bg-base)' }}>
              {children}
            </main>
          </div>
          <Toaster position="bottom-right" theme="system" />
          <GlobalAlerts />
        </Providers>
      </body>
    </html>
  );
}
