import Anthropic from '@anthropic-ai/sdk';
import * as z from 'zod/v4';
import { AGENT_MODEL, AGENT_BASE_URL, AGENT_AUTH_STYLE, requireApiKey } from './config.js';

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    const key = requireApiKey();
    const opts: ConstructorParameters<typeof Anthropic>[0] = {};
    if (AGENT_BASE_URL) opts.baseURL = AGENT_BASE_URL;
    // Gateways (DGrid) authenticate with `Authorization: Bearer`; native
    // Anthropic uses `x-api-key`. `authToken` sends the Bearer header.
    if (AGENT_AUTH_STYLE === 'bearer') opts.authToken = key;
    else opts.apiKey = key;
    client = new Anthropic(opts);
  }
  return client;
}

/**
 * Runs one agent turn: a system persona + a user prompt, constrained to a Zod
 * schema via TOOL-BASED structured output — we expose a single tool whose
 * input schema is the Zod schema and force the model to call it, then validate
 * its arguments. This works on native Anthropic and on Anthropic-compatible
 * gateways (DGrid) alike, which don't support the newer `output_config` format.
 */
export async function reason<S extends z.ZodType>(
  name: string,
  schema: S,
  system: string,
  user: string,
): Promise<z.infer<S>> {
  const toolName = `emit_${name.toLowerCase()}`;
  // Zod v4 → JSON Schema for the tool's input contract.
  const inputSchema = z.toJSONSchema(schema) as Anthropic.Tool.InputSchema;

  const res = await getClient().messages.create({
    model: AGENT_MODEL,
    max_tokens: 4096,
    system,
    messages: [{ role: 'user', content: user }],
    tools: [
      {
        name: toolName,
        description: `Return the ${name} as structured data by calling this tool.`,
        input_schema: inputSchema,
      },
    ],
    tool_choice: { type: 'tool', name: toolName },
  });

  const block = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
  if (!block) {
    throw new Error(`${name}: model did not return a tool call (stop_reason=${res.stop_reason})`);
  }
  // Validate/coerce the model's arguments against the Zod schema.
  return schema.parse(block.input);
}
