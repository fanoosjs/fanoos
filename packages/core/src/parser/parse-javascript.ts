import { parse, type ParseResult } from '@babel/parser'
import type { File } from '@babel/types'

import { createDiagnostic } from '../diagnostics/create-diagnostic'
import type { Diagnostic, SourceLocation } from '../schema'
import type { StableIdFactory } from '../utils/ids'

export interface ParsedJavaScript {
  ast: ParseResult<File> | null
  diagnostics: Diagnostic[]
}

interface ParserErrorLike {
  message?: unknown
  loc?: {
    line?: unknown
    column?: unknown
    index?: unknown
  }
  pos?: unknown
}

function parserErrorLocation(error: ParserErrorLike): SourceLocation | undefined {
  const line = typeof error.loc?.line === 'number' ? error.loc.line : undefined
  const column = typeof error.loc?.column === 'number' ? error.loc.column : undefined
  const position =
    typeof error.loc?.index === 'number'
      ? error.loc.index
      : typeof error.pos === 'number'
        ? error.pos
        : undefined

  if (line === undefined || column === undefined || position === undefined) {
    return undefined
  }

  return {
    start: position,
    end: position,
    startLine: line,
    startColumn: column,
    endLine: line,
    endColumn: column,
  }
}

function parserErrorMessage(error: ParserErrorLike): string {
  if (typeof error.message !== 'string') {
    return 'The JavaScript source could not be parsed completely.'
  }
  return error.message.replace(/\s+\(\d+:\d+\)$/, '')
}

export function parseJavaScript(source: string, ids: StableIdFactory): ParsedJavaScript {
  try {
    const ast = parse(source, {
      sourceType: 'script',
      attachComment: true,
      ranges: true,
      tokens: false,
      errorRecovery: true,
      createParenthesizedExpressions: true,
    })
    const diagnostics = ast.errors.map((error) =>
      createDiagnostic(
        ids,
        'PARSE_ERROR',
        'error',
        parserErrorLocation(error),
        parserErrorMessage(error),
      ),
    )

    return { ast, diagnostics }
  } catch (error: unknown) {
    const parserError = typeof error === 'object' && error !== null ? error : {}
    return {
      ast: null,
      diagnostics: [
        createDiagnostic(
          ids,
          'PARSE_ERROR',
          'error',
          parserErrorLocation(parserError),
          parserErrorMessage(parserError),
        ),
      ],
    }
  }
}
