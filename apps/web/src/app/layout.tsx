import type { Metadata } from 'next';
import './globals.css';
import { Shell } from '@/components/shell/shell';
import { AmbientBackground } from '@/components/mc/ambient-background';

export const metadata: Metadata = {
  title: 'SentinelOS X — Autonomous OS for Web3',
  description: 'Autonomous treasury sentinel on Casper 2.0',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans">
        <AmbientBackground />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
