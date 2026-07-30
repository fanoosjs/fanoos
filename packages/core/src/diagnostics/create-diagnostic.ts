import type { Diagnostic, DiagnosticCode, SourceLocation } from '../schema'
import type { StableIdFactory } from '../utils/ids'

const DEFAULT_MESSAGES: Record<DiagnosticCode, string> = {
  PARSE_ERROR: 'The JavaScript source could not be parsed completely.',
  UNSUPPORTED_STATEMENT: 'This statement is outside the Fanoos MVP syntax.',
  UNSUPPORTED_EXPRESSION: 'This expression is outside the Fanoos MVP syntax.',
  UNSUPPORTED_DECLARATION_PATTERN:
    'Only variables declared with a simple identifier are supported.',
  INVALID_FOR_INITIALIZER: 'The for-loop initializer is not supported.',
  INVALID_FOR_CONDITION: 'The for-loop condition is not supported.',
  INVALID_FOR_UPDATE: 'The for-loop update is not supported.',
  ENTRY_FILE_NOT_FOUND: 'The configured entry file was not found.',
  ENTRY_FILE_EXTENSION_NOT_ALLOWED: 'Only .js and .mjs entry files are allowed.',
  ANALYSIS_INTERNAL_ERROR: 'The source could not be analyzed.',
}

export function createDiagnostic(
  ids: StableIdFactory,
  code: DiagnosticCode,
  severity: Diagnostic['severity'],
  location?: SourceLocation,
  message = DEFAULT_MESSAGES[code],
): Diagnostic {
  const position = location ? `${location.start}:${location.end}` : 'global'
  const diagnostic: Diagnostic = {
    id: ids.create(`diagnostic:${code}:${position}`),
    severity,
    code,
    message,
  }

  if (location) {
    diagnostic.location = location
  }

  return diagnostic
}
