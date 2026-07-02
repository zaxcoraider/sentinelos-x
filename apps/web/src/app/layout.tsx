import type { Metadata } from 'next';
import './globals.css';
import { Shell } from '@/components/shell/shell';
import { VideoBackground } from '@/components/mc/video-background';
import { CustomCursor } from '@/components/mc/custom-cursor';

export const metadata: Metadata = {
  title: 'SentinelOS · Autonomous OS · Web3',
  description: 'SentinelOS — an autonomous operating system for Web3 protocols. AI agents. On-chain. Always on. Built on Casper.',
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
