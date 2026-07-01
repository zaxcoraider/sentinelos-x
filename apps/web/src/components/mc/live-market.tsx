'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketSnapshot {
  stable: { symbol: string; price: number; change24h: number; pegDeviation: number };
  reference: { symbol: string; price: number; change24h: number };
  source: string;
  updatedAt: string;
}

function Change({ value }: { value: number }) {
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={cn('inline-flex items-center gap-0.5 font-mono text-[11px]', up ? 'text-success' : 'text-danger')}>
      <Icon className="h-3 w-3" />
      {up ? '+' : ''}
      {value.toFixed(2)}%
    </span>
  );
}

export function LiveMarket() {
  const [data, setData] = useState<MarketSnapshot | null>(null);
  const [ok, setOk] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch('/api/market', { cache: 'no-store' });
        if (!res.ok) throw new Error();
        const json = (await res.json()) as MarketSnapshot;
        if (alive) {
          setData(json);
          setOk(true);
        }
      } catch {
        if (alive) setOk(false);
      }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const pegged = data ? data.stable.pegDeviation < 0.005 : true;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border bg-card-elevated/40 px-4 py-3 text-sm">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <span className="relative flex h-2 w-2">
          {ok && data && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
          )}
          <span className={cn('relative inline-flex h-2 w-2 rounded-full', ok ? 'bg-success' : 'bg-muted-foreground')} />
        </span>
        Live Market
      </div>

      {data ? (
        <>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Monitoring</span>
            <span className="font-semibold">{data.stable.symbol}</span>
            <motion.span
              key={data.stable.price}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              className={cn('font-mono', pegged ? 'text-success' : 'text-warning')}
            >
              ${data.stable.price.toFixed(4)}
            </motion.span>
            <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {pegged ? 'peg holding' : `${(data.stable.pegDeviation * 100).toFixed(2)}% off`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold">{data.reference.symbol}</span>
            <span className="font-mono text-foreground/90">
              ${data.reference.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <Change value={data.reference.change24h} />
          </div>

          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Activity className="h-3 w-3" />
            {data.source}
          </span>
        </>
      ) : (
        <span className="text-muted-foreground">{ok ? 'loading live prices…' : 'market feed unavailable'}</span>
      )}
    </div>
  );
}
