# Fanoos

> Illuminate your code.

![Fanoos logo](assets/logo/logo.svg)

Fanoos is a JavaScript code-understanding tool. Its name comes from the Persian word for “lantern”:
it illuminates behavior that is otherwise hidden in source code. Fanoos parses one small JavaScript
file statically, normalizes it into a runtime-validated intermediate representation, and projects
that single analysis into an overview, control-flow graph, nested structure view, source view,
navigator, and inspector.

The repository contains a framework-independent analyzer and an installable Nuxt 4 module. No input
source is executed.

## MVP scope

The MVP is designed for scripts of roughly 20–500 lines with no modules, functions, classes, or
asynchronous behavior. A configured Nuxt application receives an analysis route (by default
`/__analyse`) and a private server endpoint that reads only the configured entry.

The playground analyses `apps/playground/examples/price-calculation.js` and demonstrates:

- leading author JSDoc kept separate from generated factual text;
- variable declarations, reads, writes, and update operations;
- nested `if` branches and `for` loops;
- deterministic structural and control-flow identifiers;
- synchronized selection across flow, structure, source, navigator, and inspector;
- light and dark source tokens generated once with Shiki.

## Supported JavaScript syntax

Statements:

- `Program`, `BlockStatement`, `VariableDeclaration`, and `ExpressionStatement`;
- `IfStatement`, including `else`, `else if`, and nested conditions;
- classic `ForStatement`, including nested loops and conditions;
- `EmptyStatement`.

Expressions:

- number, string, boolean, and null literals;
- identifiers;
- binary, logical, and unary expressions;
- assignment and update expressions;
- parenthesized expressions;
- `console.log(...)` as an output operation.

Variable declarators must use a simple identifier. A classic loop such as
`for (let i = 0; i < 5; i++)` records its initialization, condition, update, and body separately.

## Unsupported syntax

Imports, exports, functions, arrow functions, classes, async/await, promises, callbacks, `switch`,
`try`/`catch`, `throw`, `while`, `do`/`while`, `break`, `continue`, `return`, destructuring, complex
object or array mutation, optional chaining, dynamic property access, template evaluation, `eval`,
`new`, browser APIs, Node APIs, and calls other than `console.log` are outside this MVP.

Unsupported syntax is not executed or guessed. It remains in program order as an
`UnsupportedNode`, keeps its source location, and produces a stable diagnostic.

## Architecture

```text
JavaScript source
  → Babel parser adapter
  → normalized expression and structure IR
  → variable analysis
  → control-flow graph
  → Zod-validated AnalysisResult
  → Overview / Flow / Structure / Source projections
```

The Babel AST is private to `fanoos`. UI code consumes only the shared `AnalysisResult`; neither Vue
nor `@fanoosjs/ui` reparses the source. Control flow and variable analysis are derived from
normalized IR rather than raw Babel nodes.

IDs are deterministic and source-based, for example `node:if:120:194` and
`edge:true:flow:condition:120:194:flow:statement:145:160`. A deterministic suffix resolves the rare
collision without randomness.

## Package responsibilities

### `fanoos`

A synchronous TypeScript library with no Nuxt, Vue, DOM, or browser dependency. It owns parsing,
JSDoc extraction, normalized IR, structural nodes, variable reads/writes, control-flow construction,
diagnostics, factual summaries, stable IDs, and final Zod validation.

### `@fanoosjs/ui`

The framework integration and visual interface package. Its current integration target is Nuxt 4:
it resolves the configured entry relative to `rootDir`, registers the page and GET-only server
route, keeps the absolute path in private runtime config, caches analysis by path/mtime/size, reuses
one Shiki highlighter, and renders the synchronized interface. Vue Flow is client guarded and ELK
is lazy-loaded only when the graph layout changes.

## Installation

Install the framework-independent analyzer:

```bash
pnpm add fanoos
```

For the Nuxt interface, install both public packages:

```bash
pnpm add fanoos @fanoosjs/ui
```

Requirements: Node.js 22 or newer.

## Repository development

```bash
corepack enable
corepack prepare pnpm@11.17.0 --activate
pnpm install
```

Start the included playground:

```bash
pnpm dev
```

Then open:

```text
http://localhost:3000/__analyse
```

## Development commands

```bash
pnpm dev            # Nuxt playground
pnpm lint           # ESLint flat config
pnpm typecheck      # core tsc + module tsc + official Nuxt typecheck
pnpm test           # core, component, module, and Nuxt integration tests
pnpm test:coverage  # V8 coverage with enforced core thresholds
pnpm build          # declarations, Nuxt module distribution, and playground
pnpm format:check   # Prettier verification
pnpm check          # lint + typecheck + test + build
```

## UI package: Nuxt usage

```ts
export default defineNuxtConfig({
  modules: [
    [
      '@fanoosjs/ui',
      {
        entry: './examples/price-calculation.js',
        route: '/__analyse',
        apiRoute: '/api/__fanoos/analyse',
        title: 'Fanoos',
      },
    ],
  ],
})
```

Options:

| Option     | Required | Default                 |
| ---------- | -------- | ----------------------- |
| `entry`    | yes      | —                       |
| `route`    | no       | `/__analyse`            |
| `apiRoute` | no       | `/api/__fanoos/analyse` |
| `title`    | no       | `Fanoos`                |
| `enabled`  | no       | `true`                  |

Only `.js` and `.mjs` entries are accepted.

## Public core API

```ts
import { readFile } from 'node:fs/promises'

import { analyzeJavaScript } from 'fanoos'

const source = await readFile('./example.js', 'utf8')

const analysis = analyzeJavaScript({
  source,
  filename: 'example.js',
})
```

`analyzeJavaScript` is synchronous and returns a validated `AnalysisResult`. The package also exports
the Zod schemas and public TypeScript types for documents, expressions, structure, flow, variables,
locations, and diagnostics.

## Brand assets

The reusable full logo, mark, favicon, color tokens, spacing rules, and rationale live in
[`assets/logo`](assets/logo). The lantern chamber contains a connected execution path: the symbol
represents software logic becoming visible, not a generic lighting product.

## AnalysisResult example

```json
{
  "version": 1,
  "document": {
    "filename": "example.js",
    "source": "let total = 0",
    "title": "example.js"
  },
  "summary": {
    "text": "This script initializes 1 variable, evaluates 0 conditions, runs 0 loops, and produces 0 outputs.",
    "variableCount": 1,
    "conditionCount": 0,
    "loopCount": 0,
    "outputCount": 0,
    "unsupportedCount": 0
  },
  "structure": [],
  "flow": {
    "nodes": [],
    "edges": []
  },
  "variables": [],
  "diagnostics": []
}
```

The shortened arrays above document the response envelope; real results contain normalized nodes,
exact locations, reads/writes, and a graph with exactly one start and one end.

## Security model

- The absolute entry path exists only in private Nuxt runtime config.
- The API accepts no file path from query strings, parameters, or request bodies.
- The handler is registered for GET only and always reads the module-configured entry.
- Entry extensions are allowlisted to `.js` and `.mjs`; existence and file type are checked.
- Source is parsed as data and is never passed to `eval`, `Function`, VM execution, dynamic import,
  or another runtime.
- Browser responses use controlled error codes and messages and do not expose internal stacks or the
  absolute path.
- Cache identity is the absolute configured path plus modification time and size.

## Testing

Vitest 4 covers the core API through behavioral assertions for empty programs, sequencing,
assignments, updates, all supported condition/loop nesting, JSDoc, output, reads/writes, unsupported
nodes, parse errors, stable IDs, schema validation, start/end cardinality, loop-back, and exit edges.

Vue component tests cover structure selection, source-line selection, variable
declaration/read/write markers, diagnostic severity, and empty branches. `@nuxt/test-utils`
integration tests build real fixtures and verify page/API registration, custom title rendering,
schema validity, path-injection resistance, missing-file errors, and SSR output.

Core coverage thresholds are enforced at 85% lines/statements, 80% functions, and 75% branches.

## Current limitations

- Variable names are aggregated by name; full lexical shadowing identity is not modeled.
- Author documentation is only the leading JSDoc block before the first statement.
- Summaries are deterministic structural facts, not domain inference.
- A parse error returns a controlled result/error state; unsupported valid nodes continue analysis.
- File changes appear after manual refresh; there is no watcher or WebSocket.
- Graph layout is desktop-first; navigator and inspector become drawers on smaller viewports.

These choices keep the MVP static, deterministic, and auditable.

## Future roadmap

- `while` loops
- `switch`
- functions
- cross-file analysis
- symbolic execution
- runtime tracing
- VS Code integration
- AI-assisted semantic labels
