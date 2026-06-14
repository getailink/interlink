/**
 * instrument.ts
 * Discovers all functions in a library and returns ready-to-use tool definitions.
 * No API key. No network. Zero external dependencies.
 */

import { discover } from './discover'
import { describe } from './describe'

export interface ToolDefinition {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, { type: string; description: string }>
    required: string[]
  }
  fn: (args: Record<string, any>) => Promise<any>
}

export function instrument(library: Record<string, any>, debug = false): ToolDefinition[] {
  const fns = discover(library)
  const tools: ToolDefinition[] = []

  for (const fn of fns) {
    const desc = describe(fn.name, fn.paramNames)

    const properties: Record<string, { type: string; description: string }> = {}
    for (const [k, v] of Object.entries(desc.parameters)) {
      properties[k] = { type: v.type, description: v.description }
    }

    // capture fn in closure to avoid loop variable issue
    const captured = fn

    tools.push({
      name: fn.name,
      description: desc.description,
      parameters: {
        type: 'object',
        properties,
        required: fn.paramNames.length > 0 ? [fn.paramNames[0]] : []
      },
      fn: async (args: Record<string, any>) => {
        try {
          if (captured.isDestructured) {
            // function expects ({ a, b, c }) — pass whole object
            return await captured.fn(args)
          } else {
            // function expects (a, b, c) — spread positional
            const positional = captured.paramNames.map(p => args[p])
            return await captured.fn(...positional)
          }
        } catch (err: any) {
          return { error: err?.message ?? 'function failed' }
        }
      }
    })

    if (debug) {
      console.log(`[interlink] ${fn.name} — "${desc.description}"`)
    }
  }

  if (debug) {
    console.log(`[interlink] ${tools.length} tools ready`)
  }

  return tools
}

/**
 * registerWith — connects discovered tools to an AILink instance.
 * This is the only step needing a provider key, and that's the caller's responsibility.
 */
export function registerWith(ai: any, tools: ToolDefinition[]): void {
  for (const tool of tools) {
    ai.register(tool.name, tool.fn, {
      description: tool.description,
      parameters: tool.parameters
    })
  }
}
