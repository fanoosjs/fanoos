import { createAnalysisDocument } from '../documentation/extract-jsdoc'
import { buildControlFlow } from '../flow/build-flow'
import { buildStructure } from '../ir/build-structure'
import { parseJavaScript } from '../parser/parse-javascript'
import {
  AnalysisResultSchema,
  AnalyzeJavaScriptOptionsSchema,
  type AnalysisResult,
  type AnalyzeJavaScriptOptions,
  type StructureNode,
} from '../schema'
import { createStableIdFactory } from '../utils/ids'
import { analyzeVariables } from '../variables/analyze-variables'

interface StructureCounts {
  conditionCount: number
  loopCount: number
  outputCount: number
  unsupportedCount: number
}

function countStructure(nodes: StructureNode[]): StructureCounts {
  return nodes.reduce<StructureCounts>(
    (counts, node) => {
      if (node.kind === 'if') {
        const nested = countStructure([...node.consequent, ...node.alternate])
        counts.conditionCount += 1 + nested.conditionCount
        counts.loopCount += nested.loopCount
        counts.outputCount += nested.outputCount
        counts.unsupportedCount += nested.unsupportedCount
      } else if (node.kind === 'for') {
        const nested = countStructure(node.body)
        counts.conditionCount += nested.conditionCount
        counts.loopCount += 1 + nested.loopCount
        counts.outputCount += nested.outputCount
        counts.unsupportedCount += nested.unsupportedCount
      } else if (node.kind === 'output') {
        counts.outputCount += 1
      } else if (node.kind === 'unsupported') {
        counts.unsupportedCount += 1
      }
      return counts
    },
    {
      conditionCount: 0,
      loopCount: 0,
      outputCount: 0,
      unsupportedCount: 0,
    },
  )
}

function quantity(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function analyzeJavaScript(options: AnalyzeJavaScriptOptions): AnalysisResult {
  const input = AnalyzeJavaScriptOptionsSchema.parse(options)
  const nodeIds = createStableIdFactory()
  const diagnosticIds = createStableIdFactory()
  const parsed = parseJavaScript(input.source, diagnosticIds)
  const firstStatement = parsed.ast?.program.body[0]
  const document = createAnalysisDocument({
    source: input.source,
    filename: input.filename,
    ...(firstStatement?.start === null || firstStatement?.start === undefined
      ? {}
      : { firstStatementStart: firstStatement.start }),
  })
  const built = parsed.ast
    ? buildStructure(parsed.ast.program, input.source, nodeIds, diagnosticIds)
    : { structure: [], diagnostics: [] }
  const variables = analyzeVariables(built.structure)
  const counts = countStructure(built.structure)
  const summaryText = `This script initializes ${quantity(variables.length, 'variable')}, evaluates ${quantity(counts.conditionCount, 'condition')}, runs ${quantity(counts.loopCount, 'loop')}, and produces ${quantity(counts.outputCount, 'output')}.`

  const result: AnalysisResult = {
    version: 1,
    document,
    summary: {
      text: summaryText,
      variableCount: variables.length,
      ...counts,
    },
    structure: built.structure,
    flow: buildControlFlow(built.structure),
    variables,
    diagnostics: [...parsed.diagnostics, ...built.diagnostics],
  }

  return AnalysisResultSchema.parse(result)
}
