/**
 * describe.ts
 * Generates descriptions from function signatures.
 * No API key needed. Pure heuristic from names.
 */

export interface Description {
  description: string
  parameters: Record<string, { type: string; description: string }>
}

export function describe(name: string, paramNames: string[]): Description {
  return {
    description: toWords(name),
    parameters: Object.fromEntries(
      paramNames.map(p => [p, { type: inferType(p), description: toWords(p) }])
    )
  }
}

function toWords(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .trim()
}

function inferType(param: string): string {
  const p = param.toLowerCase()

  if (param.length === 1) return 'number'

  // numbers checked first — prevents 'width' matching string hint 'id'
  const numberWords = [
    'value','val','num','min','max','start','end','from','to',
    'count','size','width','height','radius','index','amount','limit','offset',
    'age','length','speed','scale','duration','ms','px','weight','score',
    'rate','ratio','angle','time','timestamp','quality','intensity',
    'decimals','precision','top','left','bottom','right'
  ]
  if (numberWords.some(h => p === h || p.endsWith(h) || p.startsWith(h))) return 'number'

  const boolStart = ['is','has','enable','show','hide','flag','toggle','active','visible','force','strict','silent','debug','verbose']
  if (boolStart.some(h => p.startsWith(h))) return 'boolean'

  const stringContains = ['name','key','url','path','text','str','label','title','message','color','format','type','mode','src','file','dest','dir','tag','codec','lang','locale','query','token','id']
  if (stringContains.some(h => p.includes(h))) return 'string'

  return 'string'
}
