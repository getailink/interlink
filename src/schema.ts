/**
 * schema.ts
 * Save and load tool schemas to/from JSON files.
 *
 * WHY: The fn (actual function) can't be saved to a file.
 * But the schema (name, description, parameters) can be.
 * Save once, reuse forever. Edit descriptions manually if needed.
 */

import fs from 'fs'
import { ToolDefinition } from './instrument'

export interface ToolSchema {
  name: string
  description: string
  parameters: ToolDefinition['parameters']
}

/**
 * Save tool schemas to a JSON file.
 * Does not save the actual functions — those always come from the npm package.
 */
export function dumpSchema(tools: ToolDefinition[], filePath: string): void {
  const schemas: ToolSchema[] = tools.map(t => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters
  }))
  fs.writeFileSync(filePath, JSON.stringify(schemas, null, 2))
}

/**
 * Load schemas from file and re-attach actual functions from the library.
 * Library must be installed — schemas alone can't execute anything.
 */
export function loadSchema(
  filePath: string,
  library: Record<string, any>
): ToolDefinition[] {
  const schemas: ToolSchema[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const tools: ToolDefinition[] = []

  for (const schema of schemas) {
    // find the actual function in the library by name
    const fn = resolveFunction(library, schema.name)
    if (!fn) continue

    tools.push({
      name: schema.name,
      description: schema.description,
      parameters: schema.parameters,
      fn: async (args: Record<string, any>) => {
        try {
          return await fn(args)
        } catch (err: any) {
          return { error: err?.message ?? 'failed' }
        }
      }
    })
  }

  return tools
}

function resolveFunction(lib: Record<string, any>, name: string): Function | null {
  // handle nested names like "filters_blur"
  const parts = name.split('_')
  let current: any = lib
  for (const part of parts) {
    if (!current[part]) return null
    current = current[part]
  }
  return typeof current === 'function' ? current : null
}
