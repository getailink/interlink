/**
 * discover.ts
 * Walks any library and finds every callable function.
 * Tracks whether params are destructured or positional — needed for correct calling.
 */

export interface DiscoveredFn {
  name: string
  paramNames: string[]
  isDestructured: boolean
  fn: (...args: any[]) => any
}

export function discover(lib: Record<string, any>, prefix = '', depth = 0): DiscoveredFn[] {
  const found: DiscoveredFn[] = []
  if (depth > 1) return found

  for (const key of Object.keys(lib)) {
    try {
      const val = lib[key]
      if (val === null || val === undefined) continue
      const fullName = prefix ? `${prefix}_${key}` : key

      if (typeof val === 'function') {
        const { paramNames, isDestructured } = extractParams(val)
        found.push({ name: fullName, paramNames, isDestructured, fn: val })
      } else if (typeof val === 'object' && !Array.isArray(val)) {
        found.push(...discover(val, fullName, depth + 1))
      }
    } catch {}
  }

  return found
}

function extractParams(fn: Function): { paramNames: string[]; isDestructured: boolean } {
  try {
    const str = fn.toString()
    const match = str.match(/(?:async\s+)?(?:function[^(]*)?\(([^)]*)\)/)
    if (!match || !match[1].trim()) return { paramNames: [], isDestructured: false }

    let paramStr = match[1].trim()
    const isDestructured = paramStr.startsWith('{')

    if (isDestructured) paramStr = paramStr.replace(/[{}]/g, '').trim()

    const paramNames = paramStr
      .split(',')
      .map(p => p.trim().replace(/=.+/, '').replace(/:.+/, '').replace(/\?$/, '').trim())
      .filter(p => p.length > 0 && p !== '...' && !p.includes('{'))

    return { paramNames, isDestructured }
  } catch {
    return { paramNames: [], isDestructured: false }
  }
}
