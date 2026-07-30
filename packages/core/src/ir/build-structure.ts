import * as t from '@babel/types'

import { createDiagnostic } from '../diagnostics/create-diagnostic'
import type {
  AssignmentExpression,
  Diagnostic,
  ExpressionModel,
  IdentifierExpression,
  StructureNode,
  UpdateExpression,
} from '../schema'
import type { StableIdFactory } from '../utils/ids'
import { compactSource, locationFromNode, sourceText } from '../utils/source'

interface AdapterContext {
  source: string
  nodeIds: StableIdFactory
  diagnosticIds: StableIdFactory
  diagnostics: Diagnostic[]
}

interface StructureBuildResult {
  structure: StructureNode[]
  diagnostics: Diagnostic[]
}

function idFor(context: AdapterContext, kind: string, node: t.Node): string {
  const location = locationFromNode(node)
  return context.nodeIds.create(`node:${kind}:${location.start}:${location.end}`)
}

function textFor(context: AdapterContext, node: t.Node): string {
  return compactSource(sourceText(context.source, locationFromNode(node)))
}

function identifierExpression(context: AdapterContext, node: t.Identifier): IdentifierExpression {
  return {
    kind: 'identifier',
    name: node.name,
    location: locationFromNode(node),
    text: textFor(context, node),
  }
}

function unsupportedExpression(
  context: AdapterContext,
  node: t.Node,
  message?: string,
): ExpressionModel {
  const location = locationFromNode(node)
  context.diagnostics.push(
    createDiagnostic(
      context.diagnosticIds,
      'UNSUPPORTED_EXPRESSION',
      'warning',
      location,
      message ?? `The ${node.type} expression is outside the Fanoos MVP syntax.`,
    ),
  )
  return {
    kind: 'unsupported',
    nodeType: node.type,
    location,
    text: textFor(context, node),
  }
}

function expressionFromNode(
  context: AdapterContext,
  node: t.Node | null | undefined,
): ExpressionModel {
  if (!node) {
    return {
      kind: 'unsupported',
      nodeType: 'MissingExpression',
      location: {
        start: 0,
        end: 0,
        startLine: 1,
        startColumn: 0,
        endLine: 1,
        endColumn: 0,
      },
      text: '',
    }
  }

  if (t.isNumericLiteral(node) || t.isStringLiteral(node) || t.isBooleanLiteral(node)) {
    return {
      kind: 'literal',
      value: node.value,
      location: locationFromNode(node),
      text: textFor(context, node),
    }
  }
  if (t.isNullLiteral(node)) {
    return {
      kind: 'literal',
      value: null,
      location: locationFromNode(node),
      text: textFor(context, node),
    }
  }
  if (t.isIdentifier(node)) {
    return identifierExpression(context, node)
  }
  if (t.isBinaryExpression(node)) {
    return {
      kind: 'binary',
      operator: node.operator,
      left: expressionFromNode(context, node.left),
      right: expressionFromNode(context, node.right),
      location: locationFromNode(node),
      text: textFor(context, node),
    }
  }
  if (t.isLogicalExpression(node)) {
    return {
      kind: 'logical',
      operator: node.operator,
      left: expressionFromNode(context, node.left),
      right: expressionFromNode(context, node.right),
      location: locationFromNode(node),
      text: textFor(context, node),
    }
  }
  if (t.isUnaryExpression(node) && node.operator !== 'delete') {
    return {
      kind: 'unary',
      operator: node.operator,
      argument: expressionFromNode(context, node.argument),
      location: locationFromNode(node),
      text: textFor(context, node),
    }
  }
  if (t.isAssignmentExpression(node)) {
    if (!t.isIdentifier(node.left)) {
      return unsupportedExpression(
        context,
        node,
        'Only assignments to a simple variable identifier are supported.',
      )
    }
    const expression: AssignmentExpression = {
      kind: 'assignment',
      operator: node.operator,
      target: identifierExpression(context, node.left),
      value: expressionFromNode(context, node.right),
      location: locationFromNode(node),
      text: textFor(context, node),
    }
    return expression
  }
  if (t.isUpdateExpression(node)) {
    if (!t.isIdentifier(node.argument)) {
      return unsupportedExpression(
        context,
        node,
        'Only update expressions on a simple variable identifier are supported.',
      )
    }
    const expression: UpdateExpression = {
      kind: 'update',
      operator: node.operator,
      argument: identifierExpression(context, node.argument),
      prefix: node.prefix,
      location: locationFromNode(node),
      text: textFor(context, node),
    }
    return expression
  }
  if (t.isParenthesizedExpression(node)) {
    return {
      kind: 'parenthesized',
      expression: expressionFromNode(context, node.expression),
      location: locationFromNode(node),
      text: textFor(context, node),
    }
  }

  return unsupportedExpression(context, node)
}

function isConsoleLog(node: t.Node): node is t.CallExpression {
  return (
    t.isCallExpression(node) &&
    t.isMemberExpression(node.callee) &&
    !node.callee.computed &&
    t.isIdentifier(node.callee.object, { name: 'console' }) &&
    t.isIdentifier(node.callee.property, { name: 'log' })
  )
}

function declarationKind(node: t.VariableDeclaration): 'let' | 'const' | 'var' {
  if (node.kind === 'let' || node.kind === 'const') {
    return node.kind
  }
  return 'var'
}

function variableNodes(context: AdapterContext, statement: t.VariableDeclaration): StructureNode[] {
  return statement.declarations.map((declarator) => {
    if (!t.isIdentifier(declarator.id)) {
      const location = locationFromNode(declarator)
      context.diagnostics.push(
        createDiagnostic(
          context.diagnosticIds,
          'UNSUPPORTED_DECLARATION_PATTERN',
          'warning',
          location,
        ),
      )
      return {
        id: idFor(context, 'unsupported', declarator),
        kind: 'unsupported',
        label: 'Unsupported declaration',
        technicalLabel: textFor(context, declarator),
        description: 'Destructuring declarations are outside the MVP.',
        confidence: 'exact',
        location,
        nodeType: declarator.id.type,
        source: sourceText(context.source, location),
      }
    }

    const location = locationFromNode(declarator)
    const initializer = declarator.init ? expressionFromNode(context, declarator.init) : undefined
    const node: StructureNode = {
      id: idFor(context, 'variable', declarator),
      kind: 'variable',
      label: `Initialize ${declarator.id.name}`,
      technicalLabel: textFor(context, declarator),
      description: initializer
        ? `Declares ${declarator.id.name} with an initial value.`
        : `Declares ${declarator.id.name} without an initial value.`,
      confidence: 'exact',
      location,
      declarationKind: declarationKind(statement),
      name: declarator.id.name,
      nameLocation: locationFromNode(declarator.id),
    }
    if (initializer) {
      node.initializer = initializer
    }
    return node
  })
}

function statementList(context: AdapterContext, statement: t.Statement): StructureNode[] {
  if (t.isBlockStatement(statement)) {
    return statement.body.flatMap((child) => statementList(context, child))
  }
  if (t.isEmptyStatement(statement)) {
    return []
  }
  return statementNodes(context, statement)
}

function forInitialization(
  context: AdapterContext,
  node: t.ForStatement,
): ExpressionModel | undefined {
  const initializer = node.init
  if (!initializer) {
    return undefined
  }
  if (t.isVariableDeclaration(initializer)) {
    const declarator = initializer.declarations[0]
    if (initializer.declarations.length !== 1 || !declarator || !t.isIdentifier(declarator.id)) {
      const location = locationFromNode(initializer)
      context.diagnostics.push(
        createDiagnostic(context.diagnosticIds, 'INVALID_FOR_INITIALIZER', 'warning', location),
      )
      return unsupportedExpression(context, initializer)
    }
    const expression: ExpressionModel = {
      kind: 'declaration',
      declarationKind: declarationKind(initializer),
      name: declarator.id.name,
      nameLocation: locationFromNode(declarator.id),
      location: locationFromNode(initializer),
      text: textFor(context, initializer),
    }
    if (declarator.init) {
      expression.initializer = expressionFromNode(context, declarator.init)
    }
    return expression
  }

  const expression = expressionFromNode(context, initializer)
  if (expression.kind === 'unsupported') {
    context.diagnostics.push(
      createDiagnostic(
        context.diagnosticIds,
        'INVALID_FOR_INITIALIZER',
        'warning',
        expression.location,
      ),
    )
  }
  return expression
}

function forPart(
  context: AdapterContext,
  node: t.Node | null | undefined,
  code: 'INVALID_FOR_CONDITION' | 'INVALID_FOR_UPDATE',
): ExpressionModel | undefined {
  if (!node) {
    return undefined
  }
  const expression = expressionFromNode(context, node)
  if (expression.kind === 'unsupported') {
    context.diagnostics.push(
      createDiagnostic(context.diagnosticIds, code, 'warning', expression.location),
    )
  }
  return expression
}

function unsupportedStatement(context: AdapterContext, statement: t.Statement): StructureNode {
  const location = locationFromNode(statement)
  context.diagnostics.push(
    createDiagnostic(
      context.diagnosticIds,
      'UNSUPPORTED_STATEMENT',
      'warning',
      location,
      `The ${statement.type} statement is outside the Fanoos MVP syntax.`,
    ),
  )
  return {
    id: idFor(context, 'unsupported', statement),
    kind: 'unsupported',
    label: `Unsupported ${statement.type}`,
    technicalLabel: textFor(context, statement),
    description: 'This statement remains in source order but is not analyzed further.',
    confidence: 'exact',
    location,
    nodeType: statement.type,
    source: sourceText(context.source, location),
  }
}

function expressionStatement(
  context: AdapterContext,
  statement: t.ExpressionStatement,
): StructureNode {
  const location = locationFromNode(statement)
  if (isConsoleLog(statement.expression)) {
    return {
      id: idFor(context, 'output', statement),
      kind: 'output',
      label: 'Write to console',
      technicalLabel: textFor(context, statement),
      description: 'Produces an observable console output.',
      confidence: 'exact',
      location,
      arguments: statement.expression.arguments.map((argument) =>
        expressionFromNode(context, argument),
      ),
    }
  }

  const expression = expressionFromNode(context, statement.expression)
  if (expression.kind === 'unsupported') {
    return {
      id: idFor(context, 'unsupported', statement),
      kind: 'unsupported',
      label: 'Unsupported expression',
      technicalLabel: textFor(context, statement),
      description: 'This expression remains in source order but is not analyzed further.',
      confidence: 'exact',
      location,
      nodeType: expression.nodeType,
      source: sourceText(context.source, location),
    }
  }
  if (expression.kind === 'assignment') {
    return {
      id: idFor(context, 'assignment', statement),
      kind: 'assignment',
      label: `Write ${expression.target.name}`,
      technicalLabel: textFor(context, statement),
      description: `Updates ${expression.target.name} with the ${expression.operator} operator.`,
      confidence: 'exact',
      location,
      expression,
    }
  }
  if (expression.kind === 'update') {
    return {
      id: idFor(context, 'update', statement),
      kind: 'update',
      label: `${expression.operator === '++' ? 'Increment' : 'Decrement'} ${expression.argument.name}`,
      technicalLabel: textFor(context, statement),
      description: `Reads and updates ${expression.argument.name}.`,
      confidence: 'exact',
      location,
      expression,
    }
  }
  return {
    id: idFor(context, 'expression', statement),
    kind: 'expression',
    label: 'Evaluate expression',
    technicalLabel: textFor(context, statement),
    description: 'Evaluates a supported expression.',
    confidence: 'exact',
    location,
    expression,
  }
}

function statementNodes(context: AdapterContext, statement: t.Statement): StructureNode[] {
  if (t.isVariableDeclaration(statement)) {
    return variableNodes(context, statement)
  }
  if (t.isExpressionStatement(statement)) {
    return [expressionStatement(context, statement)]
  }
  if (t.isIfStatement(statement)) {
    const condition = expressionFromNode(context, statement.test)
    const location = locationFromNode(statement)
    return [
      {
        id: idFor(context, 'if', statement),
        kind: 'if',
        label: `Check ${condition.text || 'condition'}`,
        technicalLabel: `if (${condition.text})`,
        description: 'Chooses a branch based on the condition.',
        confidence: condition.kind === 'unsupported' ? 'unknown' : 'exact',
        location,
        condition,
        consequent: statementList(context, statement.consequent),
        alternate: statement.alternate ? statementList(context, statement.alternate) : [],
      },
    ]
  }
  if (t.isForStatement(statement)) {
    const location = locationFromNode(statement)
    const initialization = forInitialization(context, statement)
    const condition = forPart(context, statement.test, 'INVALID_FOR_CONDITION')
    const update = forPart(context, statement.update, 'INVALID_FOR_UPDATE')
    const node: StructureNode = {
      id: idFor(context, 'for', statement),
      kind: 'for',
      label: `Repeat while ${condition?.text || 'condition is present'}`,
      technicalLabel: `for (${initialization?.text ?? ''}; ${condition?.text ?? ''}; ${update?.text ?? ''})`,
      description: 'Repeats the nested body while the condition remains true.',
      confidence: [initialization, condition, update].some((part) => part?.kind === 'unsupported')
        ? 'unknown'
        : 'exact',
      location,
      body: statementList(context, statement.body),
    }
    if (initialization) {
      node.initialization = initialization
    }
    if (condition) {
      node.condition = condition
    }
    if (update) {
      node.update = update
    }
    return [node]
  }
  if (t.isBlockStatement(statement)) {
    return statement.body.flatMap((child) => statementList(context, child))
  }
  if (t.isEmptyStatement(statement)) {
    return []
  }

  return [unsupportedStatement(context, statement)]
}

export function buildStructure(
  program: t.Program,
  source: string,
  nodeIds: StableIdFactory,
  diagnosticIds: StableIdFactory,
): StructureBuildResult {
  const context: AdapterContext = {
    source,
    nodeIds,
    diagnosticIds,
    diagnostics: [],
  }
  const programNodes: t.Node[] = program.body
  const structure = programNodes.flatMap((statement) => {
    if (t.isStatement(statement)) {
      return statementNodes(context, statement)
    }

    const location = locationFromNode(statement)
    context.diagnostics.push(
      createDiagnostic(
        diagnosticIds,
        'UNSUPPORTED_STATEMENT',
        'warning',
        location,
        `The ${statement.type} module declaration is outside the Fanoos MVP syntax.`,
      ),
    )
    return [
      {
        id: idFor(context, 'unsupported', statement),
        kind: 'unsupported' as const,
        label: `Unsupported ${statement.type}`,
        technicalLabel: textFor(context, statement),
        description: 'Module syntax is not supported.',
        confidence: 'exact' as const,
        location,
        nodeType: statement.type,
        source: sourceText(source, location),
      },
    ]
  })

  return { structure, diagnostics: context.diagnostics }
}
