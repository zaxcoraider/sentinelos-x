import { Crisis } from '@/components/crisis';

// The crisis run fires live agent + on-chain calls; never statically cached.
export const dynamic = 'force-dynamic';

export default function CrisisPage() {
  return <Crisis />;
}
