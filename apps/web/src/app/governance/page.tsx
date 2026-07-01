import { GovernanceCouncil } from '@/components/governance-council';

// Convening runs the live pipeline + can write on-chain — never cached.
export const dynamic = 'force-dynamic';

export default function GovernancePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Governance Council</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          An AI council that debates the protocol&apos;s response and reaches consensus — Risk raises the
          alarm, Treasury proposes the fix, Governance drafts the motion, Commander calls consensus — then
          submits it on-chain. Real agent reasoning, no mock data.
        </p>
      </header>
      <GovernanceCouncil />
    </main>
  );
}
