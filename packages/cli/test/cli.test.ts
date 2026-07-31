import { describe, expect, it, vi } from 'vitest'

import {
  FANOOS_CLI_HELP,
  formatAnalysisSummary,
  parseCliArguments,
  runCli,
  type CliRuntime,
} from '../src/index'

function createRuntime(source = 'const total = 2 + 3\nconsole.log(total)') {
  const stdout: string[] = []
  const stderr: string[] = []
  const writeFile = vi.fn(async (_path: string, _content: string) => undefined)
  const runtime: CliRuntime = {
    cwd: '/workspace',
    readFile: vi.fn(async () => source),
    writeFile,
    stdout: (content) => stdout.push(content),
    stderr: (content) => stderr.push(content),
  }
  return { runtime, stdout, stderr, writeFile }
}

describe('Fanoos CLI arguments', () => {
  it('accepts analyse, analyze, and direct-file forms', () => {
    expect(parseCliArguments(['analyse', 'entry.js']).input).toBe('entry.js')
    expect(parseCliArguments(['analyze', 'entry.js']).input).toBe('entry.js')
    expect(parseCliArguments(['entry.js']).input).toBe('entry.js')
  })

  it('validates format and output options', () => {
    expect(
      parseCliArguments(['entry.mjs', '--format', 'json', '--output', 'analysis.json']),
    ).toMatchObject({
      input: 'entry.mjs',
      format: 'json',
      output: 'analysis.json',
    })
    expect(() => parseCliArguments(['entry.js', '--format', 'xml'])).toThrow(
      'must be "summary" or "json"',
    )
  })
})

describe('Fanoos CLI execution', () => {
  it('prints a readable static-analysis summary', async () => {
    const { runtime, stdout, stderr } = createRuntime()
    const exitCode = await runCli(['analyse', 'entry.js'], runtime)

    expect(exitCode).toBe(0)
    expect(stderr).toEqual([])
    expect(stdout.join('')).toContain('Fanoos · entry.js')
    expect(stdout.join('')).toContain('Variables     1')
    expect(stdout.join('')).toContain('Diagnostics\n  None')
  })

  it('prints schema-compatible JSON', async () => {
    const { runtime, stdout } = createRuntime()
    const exitCode = await runCli(['entry.js', '--format=json'], runtime)
    const result = JSON.parse(stdout.join('')) as {
      version: number
      document: { filename: string }
    }

    expect(exitCode).toBe(0)
    expect(result.version).toBe(1)
    expect(result.document.filename).toBe('entry.js')
  })

  it('writes output to the requested file', async () => {
    const { runtime, stdout, writeFile } = createRuntime()
    const exitCode = await runCli(['entry.js', '-o', 'result.json', '-f', 'json'], runtime)

    expect(exitCode).toBe(0)
    expect(stdout).toEqual([])
    expect(writeFile).toHaveBeenCalledWith(
      '/workspace/result.json',
      expect.stringContaining('"version": 1'),
    )
  })

  it('returns a failing status for parse errors while preserving diagnostics', async () => {
    const { runtime, stdout } = createRuntime('const =')
    const exitCode = await runCli(['broken.js'], runtime)

    expect(exitCode).toBe(1)
    expect(stdout.join('')).toContain('ERROR PARSE_ERROR')
  })

  it('returns controlled errors for invalid input and unreadable files', async () => {
    const invalid = createRuntime()
    const invalidExitCode = await runCli(['entry.ts'], invalid.runtime)
    const missing = createRuntime()
    missing.runtime.readFile = vi.fn(async () => {
      throw new Error('missing')
    })
    const missingExitCode = await runCli(['missing.js'], missing.runtime)

    expect(invalidExitCode).toBe(2)
    expect(invalid.stderr.join('')).toContain('.js or .mjs')
    expect(missingExitCode).toBe(1)
    expect(missing.stderr.join('')).toBe('Fanoos: Could not read "missing.js".\n')
  })

  it('supports help and exposes the summary formatter', async () => {
    const { runtime, stdout } = createRuntime()
    const exitCode = await runCli(['--help'], runtime)

    expect(exitCode).toBe(0)
    expect(stdout.join('')).toBe(FANOOS_CLI_HELP)
    expect(
      formatAnalysisSummary({
        version: 1,
        document: { filename: 'empty.js', source: '', title: 'empty.js' },
        summary: {
          text: 'Empty program.',
          variableCount: 0,
          conditionCount: 0,
          loopCount: 0,
          outputCount: 0,
          unsupportedCount: 0,
        },
        structure: [],
        flow: { nodes: [], edges: [] },
        variables: [],
        diagnostics: [],
      }),
    ).toContain('Empty program.')
  })
})
