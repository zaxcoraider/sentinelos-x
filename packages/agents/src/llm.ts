import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type * as z from 'zod/v4';
import { AGENT_MODEL, AGENT_THINKING, AGENT_EFFORT, requireApiKey } from './config.js';

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: requireApiKey() });
  return client;
}

/**
 * Runs one agent turn: a system persona + a user prompt, constrained to a Zod
 * schema via structured outputs. Returns the validated, typed object. Adaptive
 * thinking is enabled by default so the agents reason before answering.
 */
export async function reason<S extends z.ZodType>(
  name: string,
  schema: S,
  system: string,
  user: string,
): Promise<z.infer<S>> {
  const res = await getClient().messages.parse({
    model: AGENT_MODEL,
    max_tokens: 16000,
    system,
    messages: [{ role: 'user', content: user }],
    output_config: {
      format: zodOutputFormat(schema),
      effort: AGENT_EFFORT,
    },
    ...(AGENT_THINKING ? { thinking: { type: 'adaptive' as const } } : {}),
  });

  if (!res.parsed_output) {
    throw new Error(`${name}: model did not return schema-valid output (stop_reason=${res.stop_reason})`);
  }
  return res.parsed_output;
}
