import type { AnalysisDocument } from '../schema'
import { locationFromOffsets } from '../utils/source'

interface ExtractDocumentOptions {
  source: string
  filename: string
  firstStatementStart?: number
}

function stripLine(line: string): string {
  return line
    .replace(/^\s*\/?\*+\s?/, '')
    .replace(/\s*\*\/\s*$/, '')
    .trimEnd()
}

function splitDocumentation(raw: string) {
  const contentLines = raw.split('\n').slice(1, -1).map(stripLine)
  const tags: Array<{ name: string; value?: string }> = []
  const prose: string[] = []

  for (const line of contentLines) {
    const tag = line.trim().match(/^@(\S+)(?:\s+(.+))?$/)
    if (tag?.[1]) {
      const item: { name: string; value?: string } = { name: tag[1] }
      if (tag[2]) {
        item.value = tag[2].trim()
      }
      tags.push(item)
    } else {
      prose.push(line)
    }
  }

  const paragraphs = prose
    .join('\n')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)

  return {
    summary: paragraphs[0] ?? '',
    body: paragraphs.slice(1).join('\n\n'),
    tags,
  }
}

export function createAnalysisDocument(options: ExtractDocumentOptions): AnalysisDocument {
  const leading = options.source.match(/^\s*(\/\*\*[\s\S]*?\*\/)/)
  const raw = leading?.[1]
  const rawStart = raw ? options.source.indexOf(raw) : -1
  const isBeforeFirstStatement =
    raw !== undefined &&
    rawStart >= 0 &&
    (options.firstStatementStart === undefined ||
      rawStart + raw.length <= options.firstStatementStart)

  if (!raw || !isBeforeFirstStatement) {
    return {
      filename: options.filename,
      source: options.source,
      title: options.filename,
    }
  }

  const documentation = splitDocumentation(raw)
  const document: AnalysisDocument = {
    filename: options.filename,
    source: options.source,
    title: documentation.summary || options.filename,
    jsdoc: {
      raw,
      summary: documentation.summary,
      body: documentation.body,
      tags: documentation.tags,
      location: locationFromOffsets(options.source, rawStart, rawStart + raw.length),
    },
  }
  if (documentation.body) {
    document.description = documentation.body
  }

  return document
}
