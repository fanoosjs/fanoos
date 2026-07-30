import { z } from 'zod'

export const SourceLocationSchema = z.object({
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  startLine: z.number().int().positive(),
  startColumn: z.number().int().nonnegative(),
  endLine: z.number().int().positive(),
  endColumn: z.number().int().nonnegative(),
})

export type SourceLocation = z.infer<typeof SourceLocationSchema>

export const ConfidenceSchema = z.enum(['exact', 'inferred', 'unknown'])
export type Confidence = z.infer<typeof ConfidenceSchema>

export const DiagnosticCodeSchema = z.enum([
  'PARSE_ERROR',
  'UNSUPPORTED_STATEMENT',
  'UNSUPPORTED_EXPRESSION',
  'UNSUPPORTED_DECLARATION_PATTERN',
  'INVALID_FOR_INITIALIZER',
  'INVALID_FOR_CONDITION',
  'INVALID_FOR_UPDATE',
  'ENTRY_FILE_NOT_FOUND',
  'ENTRY_FILE_EXTENSION_NOT_ALLOWED',
  'ANALYSIS_INTERNAL_ERROR',
])

export type DiagnosticCode = z.infer<typeof DiagnosticCodeSchema>

export const DiagnosticSchema = z.object({
  id: z.string().min(1),
  severity: z.enum(['info', 'warning', 'error']),
  code: DiagnosticCodeSchema,
  message: z.string().min(1),
  location: SourceLocationSchema.optional(),
})

export type Diagnostic = z.infer<typeof DiagnosticSchema>

interface ExpressionBase {
  kind: string
  location: SourceLocation
  text: string
}

export interface LiteralExpression extends ExpressionBase {
  kind: 'literal'
  value: string | number | boolean | null
}

export interface IdentifierExpression extends ExpressionBase {
  kind: 'identifier'
  name: string
}

export interface BinaryExpression extends ExpressionBase {
  kind: 'binary' | 'logical'
  operator: string
  left: ExpressionModel
  right: ExpressionModel
}

export interface UnaryExpression extends ExpressionBase {
  kind: 'unary'
  operator: string
  argument: ExpressionModel
}

export interface AssignmentExpression extends ExpressionBase {
  kind: 'assignment'
  operator: string
  target: IdentifierExpression
  value: ExpressionModel
}

export interface UpdateExpression extends ExpressionBase {
  kind: 'update'
  operator: '++' | '--'
  argument: IdentifierExpression
  prefix: boolean
}

export interface DeclarationExpression extends ExpressionBase {
  kind: 'declaration'
  declarationKind: 'let' | 'const' | 'var'
  name: string
  nameLocation: SourceLocation
  initializer?: ExpressionModel
}

export interface ParenthesizedExpression extends ExpressionBase {
  kind: 'parenthesized'
  expression: ExpressionModel
}

export interface UnsupportedExpression extends ExpressionBase {
  kind: 'unsupported'
  nodeType: string
}

export type ExpressionModel =
  | LiteralExpression
  | IdentifierExpression
  | BinaryExpression
  | UnaryExpression
  | AssignmentExpression
  | UpdateExpression
  | DeclarationExpression
  | ParenthesizedExpression
  | UnsupportedExpression

const ExpressionBaseSchema = z.object({
  location: SourceLocationSchema,
  text: z.string(),
})

export const ExpressionModelSchema: z.ZodType<ExpressionModel> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    ExpressionBaseSchema.extend({
      kind: z.literal('literal'),
      value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
    }),
    ExpressionBaseSchema.extend({
      kind: z.literal('identifier'),
      name: z.string().min(1),
    }),
    ExpressionBaseSchema.extend({
      kind: z.literal('binary'),
      operator: z.string().min(1),
      left: ExpressionModelSchema,
      right: ExpressionModelSchema,
    }),
    ExpressionBaseSchema.extend({
      kind: z.literal('logical'),
      operator: z.string().min(1),
      left: ExpressionModelSchema,
      right: ExpressionModelSchema,
    }),
    ExpressionBaseSchema.extend({
      kind: z.literal('unary'),
      operator: z.string().min(1),
      argument: ExpressionModelSchema,
    }),
    ExpressionBaseSchema.extend({
      kind: z.literal('assignment'),
      operator: z.string().min(1),
      target: ExpressionBaseSchema.extend({
        kind: z.literal('identifier'),
        name: z.string().min(1),
      }),
      value: ExpressionModelSchema,
    }),
    ExpressionBaseSchema.extend({
      kind: z.literal('update'),
      operator: z.enum(['++', '--']),
      argument: ExpressionBaseSchema.extend({
        kind: z.literal('identifier'),
        name: z.string().min(1),
      }),
      prefix: z.boolean(),
    }),
    ExpressionBaseSchema.extend({
      kind: z.literal('declaration'),
      declarationKind: z.enum(['let', 'const', 'var']),
      name: z.string().min(1),
      nameLocation: SourceLocationSchema,
      initializer: ExpressionModelSchema.optional(),
    }),
    ExpressionBaseSchema.extend({
      kind: z.literal('parenthesized'),
      expression: ExpressionModelSchema,
    }),
    ExpressionBaseSchema.extend({
      kind: z.literal('unsupported'),
      nodeType: z.string().min(1),
    }),
  ]),
)

interface StructureBase {
  id: string
  kind: string
  label: string
  technicalLabel: string
  description?: string
  confidence: Confidence
  location: SourceLocation
}

export interface VariableStructureNode extends StructureBase {
  kind: 'variable'
  declarationKind: 'let' | 'const' | 'var'
  name: string
  nameLocation: SourceLocation
  initializer?: ExpressionModel
}

export interface AssignmentStructureNode extends StructureBase {
  kind: 'assignment'
  expression: AssignmentExpression
}

export interface UpdateStructureNode extends StructureBase {
  kind: 'update'
  expression: UpdateExpression
}

export interface ExpressionStructureNode extends StructureBase {
  kind: 'expression'
  expression: ExpressionModel
}

export interface OutputStructureNode extends StructureBase {
  kind: 'output'
  arguments: ExpressionModel[]
}

export interface IfStructureNode extends StructureBase {
  kind: 'if'
  condition: ExpressionModel
  consequent: StructureNode[]
  alternate: StructureNode[]
}

export interface ForStructureNode extends StructureBase {
  kind: 'for'
  initialization?: ExpressionModel
  condition?: ExpressionModel
  update?: ExpressionModel
  body: StructureNode[]
}

export interface UnsupportedStructureNode extends StructureBase {
  kind: 'unsupported'
  nodeType: string
  source: string
}

export type StructureNode =
  | VariableStructureNode
  | AssignmentStructureNode
  | UpdateStructureNode
  | ExpressionStructureNode
  | OutputStructureNode
  | IfStructureNode
  | ForStructureNode
  | UnsupportedStructureNode

const StructureBaseSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  technicalLabel: z.string(),
  description: z.string().optional(),
  confidence: ConfidenceSchema,
  location: SourceLocationSchema,
})

export const StructureNodeSchema: z.ZodType<StructureNode> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    StructureBaseSchema.extend({
      kind: z.literal('variable'),
      declarationKind: z.enum(['let', 'const', 'var']),
      name: z.string().min(1),
      nameLocation: SourceLocationSchema,
      initializer: ExpressionModelSchema.optional(),
    }),
    StructureBaseSchema.extend({
      kind: z.literal('assignment'),
      expression: ExpressionModelSchema.refine(
        (expression): expression is AssignmentExpression => expression.kind === 'assignment',
      ),
    }),
    StructureBaseSchema.extend({
      kind: z.literal('update'),
      expression: ExpressionModelSchema.refine(
        (expression): expression is UpdateExpression => expression.kind === 'update',
      ),
    }),
    StructureBaseSchema.extend({
      kind: z.literal('expression'),
      expression: ExpressionModelSchema,
    }),
    StructureBaseSchema.extend({
      kind: z.literal('output'),
      arguments: z.array(ExpressionModelSchema),
    }),
    StructureBaseSchema.extend({
      kind: z.literal('if'),
      condition: ExpressionModelSchema,
      consequent: z.array(StructureNodeSchema),
      alternate: z.array(StructureNodeSchema),
    }),
    StructureBaseSchema.extend({
      kind: z.literal('for'),
      initialization: ExpressionModelSchema.optional(),
      condition: ExpressionModelSchema.optional(),
      update: ExpressionModelSchema.optional(),
      body: z.array(StructureNodeSchema),
    }),
    StructureBaseSchema.extend({
      kind: z.literal('unsupported'),
      nodeType: z.string().min(1),
      source: z.string(),
    }),
  ]),
)

export const VariableInfoSchema = z.object({
  name: z.string().min(1),
  declaration: SourceLocationSchema,
  initialValue: ExpressionModelSchema.optional(),
  reads: z.array(SourceLocationSchema),
  writes: z.array(
    z.object({
      location: SourceLocationSchema,
      operation: z.string().min(1),
    }),
  ),
  contexts: z.array(z.string()),
})

export type VariableInfo = z.infer<typeof VariableInfoSchema>

export const FlowNodeSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['start', 'end', 'statement', 'condition', 'loop', 'join', 'output', 'unsupported']),
  label: z.string().min(1),
  technicalLabel: z.string(),
  location: SourceLocationSchema.optional(),
  structureNodeId: z.string().optional(),
})

export type FlowNode = z.infer<typeof FlowNodeSchema>

export const FlowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  kind: z.enum(['next', 'true', 'false', 'loop', 'exit']),
  label: z.string().optional(),
})

export type FlowEdge = z.infer<typeof FlowEdgeSchema>

export const AnalysisDocumentSchema = z.object({
  filename: z.string().min(1),
  source: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  jsdoc: z
    .object({
      raw: z.string().min(1),
      summary: z.string(),
      body: z.string(),
      tags: z.array(
        z.object({
          name: z.string().min(1),
          value: z.string().optional(),
        }),
      ),
      location: SourceLocationSchema,
    })
    .optional(),
})

export type AnalysisDocument = z.infer<typeof AnalysisDocumentSchema>

export const AnalysisResultSchema = z.object({
  version: z.literal(1),
  document: AnalysisDocumentSchema,
  summary: z.object({
    text: z.string().min(1),
    variableCount: z.number().int().nonnegative(),
    conditionCount: z.number().int().nonnegative(),
    loopCount: z.number().int().nonnegative(),
    outputCount: z.number().int().nonnegative(),
    unsupportedCount: z.number().int().nonnegative(),
  }),
  structure: z.array(StructureNodeSchema),
  flow: z.object({
    nodes: z.array(FlowNodeSchema),
    edges: z.array(FlowEdgeSchema),
  }),
  variables: z.array(VariableInfoSchema),
  diagnostics: z.array(DiagnosticSchema),
})

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>

export const AnalyzeJavaScriptOptionsSchema = z.object({
  source: z.string(),
  filename: z.string().min(1),
})

export type AnalyzeJavaScriptOptions = z.infer<typeof AnalyzeJavaScriptOptionsSchema>
