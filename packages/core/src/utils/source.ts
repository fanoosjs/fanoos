import type { Node } from '@babel/types'

import type { SourceLocation } from '../schema'

const DEFAULT_LOCATION: SourceLocation = {
  start: 0,
  end: 0,
  startLine: 1,
  startColumn: 0,
  endLine: 1,
  endColumn: 0,
}

export function locationFromNode(node: Pick<Node, 'start' | 'end' | 'loc'>): SourceLocation {
  if (typeof node.start !== 'number' || typeof node.end !== 'number' || !node.loc) {
    return { ...DEFAULT_LOCATION }
  }

  return {
    start: node.start,
    end: node.end,
    startLine: node.loc.start.line,
    startColumn: node.loc.start.column,
    endLine: node.loc.end.line,
    endColumn: node.loc.end.column,
  }
}

export function locationFromOffsets(source: string, start: number, end: number): SourceLocation {
  const beforeStart = source.slice(0, start).split('\n')
  const beforeEnd = source.slice(0, end).split('\n')

  return {
    start,
    end,
    startLine: beforeStart.length,
    startColumn: beforeStart.at(-1)?.length ?? 0,
    endLine: beforeEnd.length,
    endColumn: beforeEnd.at(-1)?.length ?? 0,
  }
}

export function sourceText(source: string, location: SourceLocation): string {
  return source.slice(location.start, location.end)
}

export function compactSource(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}
