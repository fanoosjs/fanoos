import { describe, expect, it } from 'vitest'

import {
  AnalysisResultSchema,
  analyzeJavaScript,
  type FlowNode,
  type StructureNode,
} from '../src/index'

function analyze(source: string) {
  return analyzeJavaScript({ source, filename: 'fixture.js' })
}

function flatten(nodes: StructureNode[]): StructureNode[] {
  return nodes.flatMap((node) => {
    if (node.kind === 'if') {
      return [node, ...flatten(node.consequent), ...flatten(node.alternate)]
    }
    if (node.kind === 'for') {
      return [node, ...flatten(node.body)]
    }
    return [node]
  })
}

function flowNode(result: ReturnType<typeof analyze>, kind: FlowNode['kind']) {
  return result.flow.nodes.find((node) => node.kind === kind)
}

describe('analyzeJavaScript', () => {
  it('creates a valid graph for an empty program', () => {
    const result = analyze('')

    expect(result.structure).toEqual([])
    expect(result.flow.nodes.filter((node) => node.kind === 'start')).toHaveLength(1)
    expect(result.flow.nodes.filter((node) => node.kind === 'end')).toHaveLength(1)
    expect(result.flow.edges).toEqual([
      expect.objectContaining({ source: 'flow:start', target: 'flow:end', kind: 'next' }),
    ])
  })

  it('keeps sequential variable declarations in source order', () => {
    const result = analyze('let first = 1\nconst second = first + 1')

    expect(result.structure.map((node) => node.kind)).toEqual(['variable', 'variable'])
    expect(result.variables.map((variable) => variable.name)).toEqual(['first', 'second'])
    expect(result.variables.find((variable) => variable.name === 'first')?.reads).toHaveLength(1)
  })

  it('records assignment reads and writes separately', () => {
    const result = analyze('let total = 0\nlet price = 2\ntotal = total + price')
    const total = result.variables.find((variable) => variable.name === 'total')

    expect(flatten(result.structure).some((node) => node.kind === 'assignment')).toBe(true)
    expect(total?.reads).toHaveLength(1)
    expect(total?.writes).toEqual([
      expect.objectContaining({ operation: '=', location: expect.any(Object) }),
    ])
  })

  it('records update expressions as both reads and writes', () => {
    const result = analyze('let count = 0\ncount++')
    const count = result.variables[0]

    expect(flatten(result.structure).some((node) => node.kind === 'update')).toBe(true)
    expect(count?.reads).toHaveLength(1)
    expect(count?.writes.map((write) => write.operation)).toEqual(['++'])
  })

  it('builds true and implicit false paths for if without else', () => {
    const result = analyze('let ready = true\nif (ready) console.log("yes")')
    const condition = flowNode(result, 'condition')
    const join = flowNode(result, 'join')

    expect(condition).toBeDefined()
    expect(join).toBeDefined()
    expect(result.flow.edges).toContainEqual(
      expect.objectContaining({ source: condition?.id, target: join?.id, kind: 'false' }),
    )
    expect(
      result.flow.edges.some((edge) => edge.source === condition?.id && edge.kind === 'true'),
    ).toBe(true)
  })

  it('builds explicit true and false paths for if with else', () => {
    const result = analyze('let x = 1\nif (x > 0) x = 2\nelse x = 3')
    const condition = flowNode(result, 'condition')
    const branchEdges = result.flow.edges.filter((edge) => edge.source === condition?.id)

    expect(branchEdges.map((edge) => edge.kind).sort()).toEqual(['false', 'true'])
    expect(result.structure[1]).toMatchObject({
      kind: 'if',
      consequent: [expect.objectContaining({ kind: 'assignment' })],
      alternate: [expect.objectContaining({ kind: 'assignment' })],
    })
  })

  it('preserves nested if structure', () => {
    const result = analyze('let x = 1\nif (x) { if (x > 0) x = 2 }')
    const ifNodes = flatten(result.structure).filter((node) => node.kind === 'if')

    expect(ifNodes).toHaveLength(2)
    expect(result.summary.conditionCount).toBe(2)
  })

  it('models a for loop with initialization, condition, update, loop-back and exit', () => {
    const result = analyze('for (let i = 0; i < 3; i++) console.log(i)')
    const loop = result.structure[0]
    const loopFlow = flowNode(result, 'loop')

    expect(loop).toMatchObject({
      kind: 'for',
      initialization: expect.objectContaining({ kind: 'declaration', name: 'i' }),
      condition: expect.objectContaining({ kind: 'binary', operator: '<' }),
      update: expect.objectContaining({ kind: 'update', operator: '++' }),
    })
    expect(result.flow.edges).toContainEqual(
      expect.objectContaining({ target: loopFlow?.id, kind: 'loop' }),
    )
    expect(result.flow.edges).toContainEqual(
      expect.objectContaining({ source: loopFlow?.id, kind: 'exit' }),
    )
  })

  it('supports if inside for', () => {
    const result = analyze('for (let i = 0; i < 2; i++) { if (i) console.log(i) }')

    expect(result.summary.loopCount).toBe(1)
    expect(result.summary.conditionCount).toBe(1)
    expect(flatten(result.structure).map((node) => node.kind)).toContain('if')
  })

  it('supports for inside if', () => {
    const result = analyze('let ok = true\nif (ok) for (let i = 0; i < 2; i++) console.log(i)')

    expect(flatten(result.structure).map((node) => node.kind)).toContain('for')
    expect(result.flow.nodes.filter((node) => node.kind === 'loop')).toHaveLength(1)
  })

  it('extracts only the leading JSDoc as author documentation', () => {
    const source = `/**
 * Price calculation.
 *
 * Applies documented rules.
 *
 * @category pricing
 */
let total = 0`
    const result = analyze(source)

    expect(result.document.title).toBe('Price calculation.')
    expect(result.document.description).toBe('Applies documented rules.')
    expect(result.document.jsdoc).toMatchObject({
      summary: 'Price calculation.',
      body: 'Applies documented rules.',
      tags: [{ name: 'category', value: 'pricing' }],
    })
  })

  it('recognizes console.log as output without executing it', () => {
    const result = analyze('let value = 3\nconsole.log(value)')

    expect(result.summary.outputCount).toBe(1)
    expect(flatten(result.structure)).toContainEqual(expect.objectContaining({ kind: 'output' }))
    expect(flowNode(result, 'output')).toBeDefined()
  })

  it('records reads and writes from compound expressions', () => {
    const result = analyze('let total = 1\nlet amount = 2\ntotal += amount\ntotal--')
    const total = result.variables.find((variable) => variable.name === 'total')
    const amount = result.variables.find((variable) => variable.name === 'amount')

    expect(total?.reads).toHaveLength(2)
    expect(total?.writes.map((write) => write.operation)).toEqual(['+=', '--'])
    expect(amount?.reads).toHaveLength(1)
  })

  it('keeps unsupported function declarations in order and reports them', () => {
    const result = analyze('let before = 1\nfunction nope() {}\nlet after = 2')

    expect(result.structure.map((node) => node.kind)).toEqual([
      'variable',
      'unsupported',
      'variable',
    ])
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: 'UNSUPPORTED_STATEMENT', severity: 'warning' }),
    )
  })

  it('reports destructuring without losing the declaration position', () => {
    const result = analyze('const { value } = source')

    expect(result.structure).toContainEqual(expect.objectContaining({ kind: 'unsupported' }))
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: 'UNSUPPORTED_DECLARATION_PATTERN' }),
    )
  })

  it('turns fatal parse errors into controlled diagnostics', () => {
    const result = analyze('if (')

    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: 'PARSE_ERROR', severity: 'error' }),
    )
    expect(result.flow.nodes.filter((node) => node.kind === 'start')).toHaveLength(1)
    expect(result.flow.nodes.filter((node) => node.kind === 'end')).toHaveLength(1)
  })

  it('produces stable node and edge IDs', () => {
    const source = 'let total = 0\nif (total === 0) total++'
    const first = analyze(source)
    const second = analyze(source)

    expect(first.structure.map((node) => node.id)).toEqual(second.structure.map((node) => node.id))
    expect(first.flow.nodes.map((node) => node.id)).toEqual(
      second.flow.nodes.map((node) => node.id),
    )
    expect(first.flow.edges.map((edge) => edge.id)).toEqual(
      second.flow.edges.map((edge) => edge.id),
    )
  })

  it('returns output validated by the public Zod schema', () => {
    const result = analyze('let value = null\nconsole.log(value)')

    expect(AnalysisResultSchema.safeParse(result).success).toBe(true)
  })

  it('always creates exactly one start and one end node', () => {
    for (const source of ['', 'let x = 1', 'if (true) { let x = 1 }']) {
      const result = analyze(source)
      expect(result.flow.nodes.filter((node) => node.kind === 'start')).toHaveLength(1)
      expect(result.flow.nodes.filter((node) => node.kind === 'end')).toHaveLength(1)
    }
  })

  it('creates a factual generated summary without domain guesses', () => {
    const result = analyze('let payment = 0\nif (payment === 0) payment = 1')

    expect(result.summary.text).toBe(
      'This script initializes 1 variable, evaluates 1 condition, runs 0 loops, and produces 0 outputs.',
    )
    expect(result.summary.text).not.toContain('system')
  })

  it('models logical, unary, parenthesized, and standalone expressions', () => {
    const result = analyze(
      'let active = true\nlet fallback = false\nlet result = !(active && (fallback || false))\n1 + 2',
    )
    const resultVariable = result.variables.find((variable) => variable.name === 'result')

    expect(resultVariable?.initialValue).toMatchObject({
      kind: 'unary',
      operator: '!',
      argument: expect.objectContaining({ kind: 'parenthesized' }),
    })
    expect(flatten(result.structure).some((node) => node.kind === 'expression')).toBe(true)
    expect(result.variables.find((variable) => variable.name === 'active')?.reads).toHaveLength(1)
    expect(result.variables.find((variable) => variable.name === 'fallback')?.reads).toHaveLength(1)
  })

  it('builds a valid loop when classic for parts and body are empty', () => {
    const result = analyze('for (;;) ;')
    const loop = result.structure[0]
    const condition = flowNode(result, 'loop')

    expect(loop).toMatchObject({
      kind: 'for',
      body: [],
    })
    expect(result.flow.edges).toContainEqual(
      expect.objectContaining({ source: condition?.id, kind: 'loop' }),
    )
    expect(result.flow.edges).toContainEqual(
      expect.objectContaining({ source: condition?.id, kind: 'exit' }),
    )
  })

  it('reports each invalid for-loop part without stopping the graph', () => {
    const result = analyze(
      'let source = 1\nlet object = 1\nfor (let { i } = source; check(); object.value++) {}',
    )

    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(
      expect.arrayContaining([
        'INVALID_FOR_INITIALIZER',
        'INVALID_FOR_CONDITION',
        'INVALID_FOR_UPDATE',
        'UNSUPPORTED_EXPRESSION',
      ]),
    )
    expect(result.flow.nodes.some((node) => node.kind === 'loop')).toBe(true)
  })

  it('keeps unsupported assignment targets and calls as unsupported nodes', () => {
    const result = analyze('let value\nvalue.part = 2\nrun(value)')

    expect(result.structure.map((node) => node.kind)).toEqual([
      'variable',
      'unsupported',
      'unsupported',
    ])
    expect(result.summary.unsupportedCount).toBe(2)
    expect(result.variables[0]?.initialValue).toBeUndefined()
  })
})
