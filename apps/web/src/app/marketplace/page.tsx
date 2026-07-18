import { Store } from 'lucide-react';
import { Marketplace } from '@/components/marketplace';
import { PageHeader } from '@/components/mc/page-header';

export const metadata = { title: 'Marketplace — SentinelOS' };

export default function MarketplacePage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <PageHeader
        eyebrow="Agent Store · v1 preview"
        title="Marketplace"
        icon={Store}
        tone="167, 139, 250"
        subtitle="The store where protocols will install agents like extensions. The twelve SentinelOS agents ship installed — priced at the real SOSC fees the Commander pays them today over x402. Publishing and third-party installs open in v1."
      />
      <Marketplace />
    </main>
  );
}
