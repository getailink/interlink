/**
 * Run: npx ts-node example/index.ts
 * No API key needed for discovery.
 * Key only needed if you want to run ai.run() at the end.
 */

import { instrument, registerWith } from '../src'

const videoLib = {
  trimVideo: async ({ inputFile, startTime, endTime, outputFile }: any) =>
    `Trimmed ${inputFile} from ${startTime}s to ${endTime}s → ${outputFile}`,
  addSubtitles: async ({ videoFile, subtitleFile, outputFile }: any) =>
    `Added subtitles from ${subtitleFile} to ${videoFile} → ${outputFile}`,
  convertFormat: async ({ inputFile, format, outputFile }: any) =>
    `Converted ${inputFile} to ${format} → ${outputFile}`,
  extractAudio: async ({ videoFile, outputFile }: any) =>
    `Extracted audio from ${videoFile} → ${outputFile}`,
  compressVideo: async ({ inputFile, quality, outputFile }: any) =>
    `Compressed ${inputFile} at quality ${quality} → ${outputFile}`,
  getVideoInfo: async ({ videoFile }: any) =>
    `Info for ${videoFile}: duration=120s, resolution=1920x1080`
}

// Step 1: Instrument — zero keys, zero network, zero setup
const tools = instrument(videoLib, true)

// Step 2: Show what was generated
console.log('\n=== TOOL PACKAGE ===\n')
for (const tool of tools) {
  const params = Object.entries(tool.parameters.properties)
    .map(([k, v]) => `${k}:${v.type}`)
    .join('  ')
  console.log(`${tool.name.padEnd(20)} "${tool.description}"`)
  console.log(`  ${params}\n`)
}

console.log(`${tools.length} tools ready. Pass this to any AI.\n`)

// Step 3: Mock AI registration and local execution
class MockAI {
  public registered: Record<string, { fn: Function; schema: any }> = {}

  register(name: string, fn: Function, schema: any) {
    this.registered[name] = { fn, schema }
  }
}

const mockAi = new MockAI()
registerWith(mockAi, tools)

console.log('Registered:', Object.keys(mockAi.registered))

// Call one registered tool's fn with sample args to demonstrate end-to-end execution
const trimVideoTool = mockAi.registered['trimVideo']
if (trimVideoTool) {
  trimVideoTool.fn({
    inputFile: 'video.mp4',
    startTime: 10,
    endTime: 45,
    outputFile: 'trimmed.mp4'
  }).then((res: any) => {
    console.log('\nTesting trimVideo tool execution:')
    console.log(`Result: ${res}`)
  })
}

/*
// How to use with a real AILink instance:
//
// import { AILink } from '@ailink/sdk'
//
// const ai = new AILink({ provider: 'groq', providerKey: process.env.GROQ_KEY })
// registerWith(ai, tools)
//
// const result = await ai.run('Cut my video.mp4 from 10 seconds to 45 seconds and save as trimmed.mp4')
// console.log('AI Response:', result.response)
*/
