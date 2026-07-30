import type { AnalysisResult, Diagnostic, StructureNode } from 'fanoos'

export interface SourceToken {
  content: string
  color?: string
  fontStyle?: number
}

export interface SourceTokenSet {
  light: SourceToken[][]
  dark: SourceToken[][]
}

export interface AnalysisPayload extends AnalysisResult {
  sourceTokens: SourceTokenSet
}

export interface AnalysisApiError {
  statusCode: number
  statusMessage: string
  data?: {
    code?: Diagnostic['code']
    message?: string
    analysis?: AnalysisResult
  }
}

export interface FlatStructureNode {
  node: StructureNode
  depth: number
  branch: 'root' | 'true' | 'false' | 'loop'
}
