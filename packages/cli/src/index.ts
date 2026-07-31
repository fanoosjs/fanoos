import { readFile as readTextFile, writeFile as writeTextFile } from 'node:fs/promises'
import { basename, extname, resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { analyzeJavaScript, type AnalysisResult } from '@fanoosjs/core'

export const FANOOS_CLI_VERSION = '0.1.0'

export const FANOOS_CLI_HELP = `Fanoos · Illuminate your code.

Usage:
  fanoos analyse <file> [options]
  fanoos analyze <file> [options]
  fanoos <file> [options]

Options:
  -f, --format <summary|json>  Output format (default: summary)
  -o, --output <file>          Write the result to a file
  -h, --help                   Show this help
  -v, --version                Show the CLI version

Fanoos parses JavaScript statically. The input file is never executed.
`

export type CliFormat = 'summary' | 'json'

export interface CliArguments {
  input?: string
  format: CliFormat
  output?: string
  help: boolean
  version: boolean
}

export interface CliRuntime {
  cwd: string
  readFile(path: string): Promise<string>
  writeFile(path: string, content: string): Promise<void>
  stdout(content: string): void
  stderr(content: string): void
}

export class CliUsageError extends Error {
  override name = 'CliUsageError'
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function createNodeRuntime(): CliRuntime {
  return {
    cwd: process.cwd(),
    readFile: (path) => readTextFile(path, 'utf8'),
    writeFile: (path, content) => writeTextFile(path, content, 'utf8'),
    stdout: (content) => process.stdout.write(content),
    stderr: (content) => process.stderr.write(content),
  }
}

function withTrailingNewline(content: string): string {
  return content.endsWith('\n') ? content : `${content}\n`
}

export function parseCliArguments(args: readonly string[]): CliArguments {
  let parsed: ReturnType<typeof parseArgs>
  try {
    parsed = parseArgs({
      args: [...args],
      allowPositionals: true,
      strict: true,
      options: {
        format: { type: 'string', short: 'f' },
        output: { type: 'string', short: 'o' },
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'v' },
      },
    })
  } catch (error: unknown) {
    throw new CliUsageError(messageFrom(error))
  }

  const positionals = [...parsed.positionals]
  let help = parsed.values.help === true
  const first = positionals[0]
  if (first === 'help') {
    help = true
    positionals.shift()
  } else if (first === 'analyse' || first === 'analyze') {
    positionals.shift()
  }

  if (positionals.length > 1) {
    throw new CliUsageError('Expected one JavaScript file.')
  }

  const format = parsed.values.format ?? 'summary'
  if (format !== 'summary' && format !== 'json') {
    throw new CliUsageError('The --format option must be "summary" or "json".')
  }
  const output = typeof parsed.values.output === 'string' ? parsed.values.output : undefined

  return {
    ...(positionals[0] ? { input: positionals[0] } : {}),
    format,
    ...(output ? { output } : {}),
    help,
    version: parsed.values.version === true,
  }
}

export function formatAnalysisSummary(analysis: AnalysisResult): string {
  const lines = [
    `Fanoos · ${analysis.document.filename}`,
    analysis.document.title,
    '',
    analysis.summary.text,
    '',
    'Analysis',
    `  Variables     ${analysis.summary.variableCount}`,
    `  Conditions    ${analysis.summary.conditionCount}`,
    `  Loops         ${analysis.summary.loopCount}`,
    `  Outputs       ${analysis.summary.outputCount}`,
    `  Unsupported   ${analysis.summary.unsupportedCount}`,
    '',
    'Diagnostics',
  ]

  if (analysis.diagnostics.length === 0) {
    lines.push('  None')
  } else {
    for (const diagnostic of analysis.diagnostics) {
      const location = diagnostic.location
        ? `L${diagnostic.location.startLine}:${diagnostic.location.startColumn + 1}`
        : 'global'
      lines.push(
        `  ${diagnostic.severity.toUpperCase()} ${diagnostic.code} ${location} · ${diagnostic.message}`,
      )
    }
  }

  return lines.join('\n')
}

export function formatAnalysis(analysis: AnalysisResult, format: CliFormat): string {
  return format === 'json' ? JSON.stringify(analysis, null, 2) : formatAnalysisSummary(analysis)
}

export async function runCli(
  args: readonly string[],
  runtimeOverrides: Partial<CliRuntime> = {},
): Promise<number> {
  const runtime: CliRuntime = { ...createNodeRuntime(), ...runtimeOverrides }

  let options: CliArguments
  try {
    options = parseCliArguments(args)
  } catch (error: unknown) {
    runtime.stderr(`Fanoos: ${messageFrom(error)}\n\n${FANOOS_CLI_HELP}`)
    return 2
  }

  if (options.version) {
    runtime.stdout(`${FANOOS_CLI_VERSION}\n`)
    return 0
  }
  if (options.help) {
    runtime.stdout(FANOOS_CLI_HELP)
    return 0
  }
  if (!options.input) {
    runtime.stderr(`Fanoos: A JavaScript file is required.\n\n${FANOOS_CLI_HELP}`)
    return 2
  }

  const extension = extname(options.input).toLowerCase()
  if (extension !== '.js' && extension !== '.mjs') {
    runtime.stderr('Fanoos: The input file must use the .js or .mjs extension.\n')
    return 2
  }

  const inputPath = resolve(runtime.cwd, options.input)
  let source: string
  try {
    source = await runtime.readFile(inputPath)
  } catch {
    runtime.stderr(`Fanoos: Could not read "${options.input}".\n`)
    return 1
  }

  let analysis: AnalysisResult
  try {
    analysis = analyzeJavaScript({
      source,
      filename: basename(inputPath),
    })
  } catch (error: unknown) {
    runtime.stderr(`Fanoos: Analysis failed: ${messageFrom(error)}\n`)
    return 1
  }

  const output = withTrailingNewline(formatAnalysis(analysis, options.format))
  if (options.output) {
    try {
      await runtime.writeFile(resolve(runtime.cwd, options.output), output)
    } catch {
      runtime.stderr(`Fanoos: Could not write "${options.output}".\n`)
      return 1
    }
  } else {
    runtime.stdout(output)
  }

  return analysis.diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 1 : 0
}
