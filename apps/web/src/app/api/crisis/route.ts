import { runPipeline } from '@sentinelos/agents';
import type { MarketEvent, TraceStep } from '@sentinelos/agents';

// The pipeline signs Casper txs and calls Claude — must run on the Node runtime,
// never cached (every run is a real, live invocation).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** The canonical demo scenario: a 7% USDx stablecoin depeg. */
const DEFAULT_EVENT: MarketEvent = { type: 'DEPEG', asset: 'USDx', deviation: 0.07 };

/**
 * Streams the sentinel crisis pipeline as newline-delimited JSON so the UI can
 * render each agent's step the moment it truly completes:
 *   {type:'start', event} → {type:'step', step}… → {type:'result', result}
 * (or {type:'error', message} on failure).
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const event: MarketEvent =
    (body?.event as MarketEvent | undefined) ?? DEFAULT_EVENT;
  // Default to a real on-chain write; pass { live: false } for a dry wiring check.
  const live = body?.live !== false;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
      try {
        send({ type: 'start', event, live });
        const result = await runPipeline(event, {
          live,
          onStep: (step: TraceStep) => send({ type: 'step', step }),
        });
        send({ type: 'result', result });
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : 'pipeline failed' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
