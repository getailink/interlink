// This example requires no npm install — it uses Node's built-in path module.

import { instrument, dumpSchema } from '../src'
import * as path from 'node:path'

// Instrument the built-in path module with debugging enabled
const tools = instrument(path, true)

// Save the generated schemas to a JSON file
dumpSchema(tools, './path-schema.json')

// Log the total tool count
console.log(`Total tools: ${tools.length}`)

// Find 'join' and 'basename' tools
const joinTool = tools.find(t => t.name === 'join')
const basenameTool = tools.find(t => t.name === 'basename')

// Pretty-print the schemas for 'join' and 'basename'
if (joinTool) {
  console.log('Join Schema:')
  console.log(JSON.stringify(joinTool, null, 2))
}
if (basenameTool) {
  console.log('Basename Schema:')
  console.log(JSON.stringify(basenameTool, null, 2))
}

// Call functions and log results
async function main() {
  if (joinTool) {
    const result = await joinTool.fn({ args: ['foo', 'bar', 'baz.txt'] })
    console.log('Result of join:', result)
  }

  if (basenameTool) {
    const result = await basenameTool.fn({ path: '/a/b/c.txt' })
    console.log('Result of basename:', result)
  }
}

main().catch(console.error)
