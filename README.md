# interlink

Auto-discover every function in a JavaScript object or library and generate
[AILink](https://github.com/getailink/ailink-sdk)-compatible tool definitions
from them — without writing `ai.register()` by hand for each one.

interlink does not replace or modify AILink. It produces the inputs
`ai.register()` expects, generated automatically from function names and
signatures.

---

## Why

AILink lets you register any function as an AI-callable tool:

```ts
ai.register('trimVideo', wrappedFn, {
  description: 'Trims a video to the given start and end time',
  parameters: {
    type: 'object',
    properties: {
      inputFile: { type: 'string', description: 'Input file path' },
      startTime: { type: 'number', description: 'Start time in seconds' },
      endTime:   { type: 'number', description: 'End time in seconds' },
      outputFile:{ type: 'string', description: 'Output file path' }
    },
    required: ['inputFile']
  }
})
```

For a library with dozens of functions, writing this by hand for every one
is repetitive. interlink generates it automatically:

```ts
import { instrument, registerWith } from 'interlink'
import { AILink } from '@ailink/sdk'
import * as videoLib from 'some-video-library'

const ai = new AILink({ provider: 'groq', providerKey: process.env.GROQ_KEY! })

const tools = instrument(videoLib)
registerWith(ai, tools)

const result = await ai.run('Trim video.mp4 from 10s to 45s and save as out.mp4')
console.log(result.response)
```

---

## Install

```bash
npm install interlink @ailink/sdk
```

Requires Node.js 18+ (same as `@ailink/sdk`).

`@ailink/sdk` is an optional peer dependency — `instrument()`, `discover()`,
`describe()`, `dumpSchema()`, and `loadSchema()` work without it. It's only
needed to actually run `registerWith(ai, tools)` against a real AILink
instance and call `ai.run()`.

---

## Quick Start

```ts
import { instrument } from 'interlink'

const mathLib = {
  add: (a: number, b: number) => a + b,
  clamp: (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max)
}

const tools = instrument(mathLib, true)
// [interlink] add — "add"
// [interlink] clamp — "clamp"
// [interlink] 2 tools ready

console.log(tools[0])
// {
//   name: 'add',
//   description: 'add',
//   parameters: {
//     type: 'object',
//     properties: {
//       a: { type: 'number', description: 'a' },
//       b: { type: 'number', description: 'b' }
//     },
//     required: ['a']
//   },
//   fn: [AsyncFunction]
// }
```

`tools` is ready to pass to `registerWith(ai, tools)`.

See [`example/index.ts`](./example/index.ts) for a full runnable example with
a mock video-editing library.

---

## API

### `discover(library)`

Walks an object up to 2 levels deep and returns every function found, along
with its parameter names and whether it uses destructured (`{a, b}`) or
positional (`a, b`) arguments.

```ts
discover({ trimVideo: ({ inputFile, startTime }) => {} })
// → [{ name: 'trimVideo', paramNames: ['inputFile','startTime'], isDestructured: true, fn: ... }]
```

### `describe(name, paramNames)`

Pure heuristic — no AI, no network calls. Converts camelCase names to
readable descriptions and infers parameter types (`string` / `number` /
`boolean`) from naming patterns.

```ts
describe('trimVideo', ['inputFile', 'startTime'])
// → {
//     description: 'trim video',
//     parameters: {
//       inputFile: { type: 'string', description: 'input file' },
//       startTime: { type: 'number', description: 'start time' }
//     }
//   }
```

### `instrument(library, debug?)`

Runs `discover` + `describe` on every function in `library`, and wraps each
one so it can be called with a single args object — correctly handling both
destructured and positional functions. Returns `ToolDefinition[]`.

### `registerWith(ai, tools)`

Calls `ai.register(tool.name, tool.fn, { description, parameters })` for
every tool. One call registers everything `instrument()` found.

`ai` just needs a `.register(name, fn, schema)` method matching AILink's
signature — no import of `@ailink/sdk` is required by interlink itself.

### `dumpSchema(tools, filePath)`

Writes the schema portion (name, description, parameters) of each tool to a
JSON file. Does not save the functions themselves — those always come from
the installed library at runtime.

### `loadSchema(filePath, library)`

Reads a schema JSON file and re-attaches live functions from `library` by
matching names. Useful for editing auto-generated descriptions by hand and
reloading without re-running discovery.

```ts
const tools = instrument(videoLib)
dumpSchema(tools, './videolib-schema.json')

// edit videolib-schema.json by hand if needed, then later:
const tools2 = loadSchema('./videolib-schema.json', videoLib)
```

---

## What it does NOT do

- **No smart tool selection.** `instrument()` registers everything it finds.
  If you register hundreds of functions, all of them are sent to the AI on
  every `ai.run()` call. Use AILink's own `group` filtering manually if you
  need to scope tools per request.
- **No class/constructor support.** Only plain objects and their own function
  properties, up to 2 levels of nesting.
- **No `this`-binding handling.** Bind methods before passing them in if they
  rely on a specific `this`.
- **No AI-generated descriptions.** Descriptions are inferred from names only.
  Clearer function and parameter names produce better results.
- **Duplicate names after flattening will throw.** Two nested objects each
  having e.g. a `run` method both flatten to `..._run`-style collisions if
  their parent keys also collide — `registerWith` will throw on the second
  `ai.register()` call, the same as AILink's `ToolAlreadyExistsError`.

---

## Testing status

Tested end-to-end against the compiled `dist/` output in this repo:

| Function | Status |
|---|---|
| `discover()` | ✅ tested |
| `describe()` | ✅ tested |
| `instrument()` | ✅ tested |
| `dumpSchema()` / `loadSchema()` | ✅ tested |
| `registerWith()` | ✅ tested against a mock matching AILink's `ai.register(name, fn, schema)` signature |
| Real `@ailink/sdk` + `ai.run()` | ⚠️ not yet verified — requires a provider key |

If you hit an issue running this against a real AILink instance, please open
an issue with the error and a minimal repro.

---

## Project structure

```
src/
  discover.ts    — finds functions in an object, 2 levels deep
  describe.ts    — name/param → description + type, heuristic only
  instrument.ts  — combines discover + describe, returns ToolDefinition[]
  schema.ts      — dumpSchema / loadSchema for JSON file caching
  index.ts       — exports
example/
  index.ts       — runnable example using a mock video-editing object
```

---

## License

MIT
