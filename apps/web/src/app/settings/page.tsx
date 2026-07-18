import { Settings } from 'lucide-react';
import { explorerContractUrl } from '@sentinelos/casper';
import { SettingsPreview } from '@/components/settings-preview';
import { PageHeader } from '@/components/mc/page-header';

export const metadata = { title: 'Settings — SentinelOS' };

export default function SettingsPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
      <PageHeader
        eyebrow="Runtime Configuration · v1 preview"
        title="Settings"
        icon={Settings}
        tone="148, 163, 184"
        subtitle="The current live configuration of your sentinel team — anchoring, economy, network — plus the autonomy dial that ships in v1: choose how much the OS does on its own before a human steps in."
      />
      <SettingsPreview contractUrl={explorerContractUrl()} />
    </main>
  );
}
