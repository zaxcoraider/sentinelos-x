import type { Metadata } from 'next';
import './globals.css';
import { Shell } from '@/components/shell/shell';
import { VideoBackground } from '@/components/mc/video-background';
import { CustomCursor } from '@/components/mc/custom-cursor';

export const metadata: Metadata = {
  title: 'SentinelOS X — Autonomous OS for Web3',
  description: 'Autonomous treasury sentinel on Casper 2.0',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans">
        <VideoBackground />
        <CustomCursor />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
