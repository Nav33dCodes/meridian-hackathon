import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Providers } from './providers';
import { Sidebar } from '@/components/shared/Sidebar';
import { GlobalAlerts } from '@/components/shared/GlobalAlerts';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { ThermalController } from '@/components/shared/ThermalController';
import { AppToaster } from '@/components/shared/AppToaster';
import { THERMAL_ATTRIBUTE, THERMAL_STORAGE_KEY } from '@/lib/thermal';

// Applies the stored Thermal Vision preference before first paint, so a reload
// in thermal mode never flashes the light palette.
const thermalBootScript = `(function(){try{if(localStorage.getItem('${THERMAL_STORAGE_KEY}')==='1'){document.documentElement.setAttribute('${THERMAL_ATTRIBUTE}','on')}}catch(e){}})();`;

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
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: thermalBootScript }} />
      </head>
      <body className="bg-base text-primary font-sans antialiased">
        <Providers>
          <div className="flex min-h-screen bg-base">
            <Sidebar />
            <main className="flex-1 overflow-auto bg-base">
              {children}
            </main>
          </div>
          <AppToaster />
          <GlobalAlerts />
          <CommandPalette />
          <ThermalController />
        </Providers>
      </body>
    </html>
  );
}
