import { Landmark } from 'lucide-react';
import { GovernanceCouncil } from '@/components/governance-council';
import { PageHeader } from '@/components/mc/page-header';

// Convening runs the live pipeline + can write on-chain — never cached.
export const dynamic = 'force-dynamic';

export default function GovernancePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <PageHeader
        eyebrow="DAO Operations"
        title="Governance Council"
        icon={Landmark}
        tone="167, 139, 250"
        subtitle="An AI council that debates the protocol's response and reaches consensus — Risk raises the alarm, Treasury proposes the fix, Governance drafts the motion, Commander calls consensus — then submits it on-chain. Real agent reasoning, no mock data."
      />
      <GovernanceCouncil />
    </main>
  );
}
