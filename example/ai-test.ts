// This example requires no npm install of external components other than @ailink/sdk.
// It uses Node's built-in path module.

import fs from 'fs'
import path from 'path'
import { instrument, registerWith } from '../src'
import { AILink } from '@ailink/sdk'
import * as nodePath from 'node:path'

// Inline .env loader (no dotenv dependency)
try {
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    const lines = content.split(/\r?\n/)
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim()
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
        process.env[key] = val
      }
    }
  }
} catch (err) {
  // continue silently
}

const GROQ_KEY = process.env.GROQ_KEY

if (!GROQ_KEY || GROQ_KEY.trim() === '') {
  console.log(
    "No GROQ_KEY found. Create a .env file in the project root with:\n" +
    "GROQ_KEY=your_key_here\n" +
    "Get a free key at console.groq.com"
  )
  process.exit(0)
}

async function main() {
  const ai = new AILink({ provider: 'groq', providerKey: GROQ_KEY! })
  const tools = instrument(nodePath)
  registerWith(ai, tools)

  console.log(`Registered ${tools.length} tools with AILink\n`)

  const testCases = [
    {
      id: 'a',
      prompt: "What is the file extension of /home/user/document.pdf?",
      expected: 'extname'
    },
    {
      id: 'b',
      prompt: "Join these path segments together: src, components, Button.tsx",
      expected: 'join'
    },
    {
      id: 'c',
      prompt: "What is the directory name of /var/log/syslog?",
      expected: 'dirname'
    }
  ]

  const results: Array<{ prompt: string; toolsCalled: string; expected: string }> = []

  for (const tc of testCases) {
    console.log(`Running prompt: "${tc.prompt}"`)
    const result = await ai.run(tc.prompt)
    console.log(`Response: ${result.response}`)
    console.log(`Tools Called: ${JSON.stringify(result.toolsCalled)}\n`)

    results.push({
      prompt: tc.prompt,
      toolsCalled: Array.isArray(result.toolsCalled)
        ? result.toolsCalled.join(', ')
        : String(result.toolsCalled || ''),
      expected: tc.expected
    })
  }

  console.log('=== SUMMARY TABLE ===')
  console.log('prompt | tool(s) called | expected tool')
  console.log('---|---|---')
  for (const res of results) {
    console.log(`"${res.prompt}" | ${res.toolsCalled || 'none'} | ${res.expected}`)
  }
}

main().catch(console.error)
