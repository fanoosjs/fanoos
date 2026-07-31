import { stat, readFile } from 'node:fs/promises'
import { extname } from 'node:path'

import {
  AnalysisResultSchema,
  analyzeJavaScript,
  type AnalysisResult,
  type DiagnosticCode,
} from '@fanoosjs/core'
import { createError, defineEventHandler } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { createHighlighter, type Highlighter } from 'shiki'

import type { AnalysisPayload, SourceToken, SourceTokenSet } from '../types'

interface CacheEntry {
  signature: string
  payload: AnalysisPayload
}

const analysisCache = new Map<string, CacheEntry>()
let highlighterPromise: Promise<Highlighter> | undefined

function controlledError(
  statusCode: number,
  code: DiagnosticCode,
  message: string,
  analysis?: AnalysisResult,
) {
  return createError({
    statusCode,
    statusMessage: message,
    message,
    data: {
      code,
      message,
      ...(analysis ? { analysis } : {}),
    },
  })
}

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: ['javascript'],
  })
  return highlighterPromise
}

function normalizeTokens(
  tokens: Array<Array<{ content: string; color?: string; fontStyle?: number }>>,
): SourceToken[][] {
  return tokens.map((line) =>
    line.map((token) => ({
      content: token.content,
      ...(token.color ? { color: token.color } : {}),
      ...(token.fontStyle === undefined ? {} : { fontStyle: token.fontStyle }),
    })),
  )
}

async function tokenizeSource(source: string): Promise<SourceTokenSet> {
  const highlighter = await getHighlighter()
  const light = highlighter.codeToTokens(source, {
    lang: 'javascript',
    theme: 'github-light',
  })
  const dark = highlighter.codeToTokens(source, {
    lang: 'javascript',
    theme: 'github-dark',
  })
  return {
    light: normalizeTokens(light.tokens),
    dark: normalizeTokens(dark.tokens),
  }
}

export default defineEventHandler(async (event): Promise<AnalysisPayload> => {
  const config = useRuntimeConfig(event)
  const entry = config.fanoos.entry
  if (!entry || !['.js', '.mjs'].includes(extname(entry).toLowerCase())) {
    throw controlledError(
      400,
      'ENTRY_FILE_EXTENSION_NOT_ALLOWED',
      'The configured entry must be a .js or .mjs file.',
    )
  }

  let metadata
  try {
    metadata = await stat(entry)
  } catch {
    throw controlledError(404, 'ENTRY_FILE_NOT_FOUND', 'The configured entry file was not found.')
  }
  if (!metadata.isFile()) {
    throw controlledError(404, 'ENTRY_FILE_NOT_FOUND', 'The configured entry is not a file.')
  }

  const signature = `${metadata.mtimeMs}:${metadata.size}`
  const cached = analysisCache.get(entry)
  if (cached?.signature === signature) {
    return cached.payload
  }

  try {
    const source = await readFile(entry, 'utf8')
    const filename = entry.split(/[\\/]/).at(-1) ?? 'entry.js'
    const analysis = AnalysisResultSchema.parse(analyzeJavaScript({ source, filename }))
    if (analysis.diagnostics.some((diagnostic) => diagnostic.code === 'PARSE_ERROR')) {
      throw controlledError(
        422,
        'PARSE_ERROR',
        'The configured JavaScript file contains a parse error.',
        analysis,
      )
    }
    const payload: AnalysisPayload = {
      ...analysis,
      sourceTokens: await tokenizeSource(source),
    }
    analysisCache.set(entry, { signature, payload })
    return payload
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'statusCode' in error) {
      throw error
    }
    throw controlledError(
      500,
      'ANALYSIS_INTERNAL_ERROR',
      'The configured source could not be analyzed.',
    )
  }
})
