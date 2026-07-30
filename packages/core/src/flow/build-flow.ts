import type { FlowEdge, FlowNode, StructureNode } from '../schema'
import { createStableIdFactory } from '../utils/ids'

type EdgeKind = FlowEdge['kind']

interface Incoming {
  id: string
  kind: EdgeKind
}

interface FlowContext {
  nodes: FlowNode[]
  edges: FlowEdge[]
  nodeIds: ReturnType<typeof createStableIdFactory>
  edgeIds: ReturnType<typeof createStableIdFactory>
}

function addEdge(context: FlowContext, source: string, target: string, kind: EdgeKind) {
  const label =
    kind === 'true'
      ? 'True'
      : kind === 'false'
        ? 'False'
        : kind === 'loop'
          ? 'Repeat'
          : kind === 'exit'
            ? 'Exit'
            : undefined
  const edge: FlowEdge = {
    id: context.edgeIds.create(`edge:${kind}:${source}:${target}`),
    source,
    target,
    kind,
  }
  if (label) {
    edge.label = label
  }
  context.edges.push(edge)
}

function connectIncoming(context: FlowContext, incoming: Incoming[], target: string) {
  incoming.forEach((entry) => addEdge(context, entry.id, target, entry.kind))
}

function flowNodeFor(context: FlowContext, node: StructureNode): FlowNode {
  const kind: FlowNode['kind'] =
    node.kind === 'output'
      ? 'output'
      : node.kind === 'unsupported'
        ? 'unsupported'
        : node.kind === 'if'
          ? 'condition'
          : node.kind === 'for'
            ? 'loop'
            : 'statement'
  const flowNode: FlowNode = {
    id: context.nodeIds.create(`flow:${kind}:${node.location.start}:${node.location.end}`),
    kind,
    label: node.label,
    technicalLabel: node.technicalLabel,
    location: node.location,
    structureNodeId: node.id,
  }
  context.nodes.push(flowNode)
  return flowNode
}

function addSyntheticNode(
  context: FlowContext,
  kind: 'join' | 'statement',
  label: string,
  technicalLabel: string,
  identity: string,
  structureNode?: StructureNode,
): FlowNode {
  const node: FlowNode = {
    id: context.nodeIds.create(`flow:${kind}:${identity}`),
    kind,
    label,
    technicalLabel,
  }
  if (structureNode) {
    node.location = structureNode.location
    node.structureNodeId = structureNode.id
  }
  context.nodes.push(node)
  return node
}

function buildSequence(
  context: FlowContext,
  nodes: StructureNode[],
  incoming: Incoming[],
): Incoming[] {
  return nodes.reduce((current, node) => buildStructureNode(context, node, current), incoming)
}

function buildIf(
  context: FlowContext,
  node: Extract<StructureNode, { kind: 'if' }>,
  incoming: Incoming[],
) {
  const condition = flowNodeFor(context, node)
  connectIncoming(context, incoming, condition.id)
  const join = addSyntheticNode(
    context,
    'join',
    'Merge branches',
    'if join',
    `${node.location.start}:${node.location.end}`,
    node,
  )

  if (node.consequent.length === 0) {
    addEdge(context, condition.id, join.id, 'true')
  } else {
    const trueExits = buildSequence(context, node.consequent, [{ id: condition.id, kind: 'true' }])
    connectIncoming(context, trueExits, join.id)
  }

  if (node.alternate.length === 0) {
    addEdge(context, condition.id, join.id, 'false')
  } else {
    const falseExits = buildSequence(context, node.alternate, [{ id: condition.id, kind: 'false' }])
    connectIncoming(context, falseExits, join.id)
  }

  return [{ id: join.id, kind: 'next' as const }]
}

function buildFor(
  context: FlowContext,
  node: Extract<StructureNode, { kind: 'for' }>,
  incoming: Incoming[],
) {
  let loopIncoming = incoming
  if (node.initialization) {
    const initialization = addSyntheticNode(
      context,
      'statement',
      'Initialize loop',
      node.initialization.text,
      `for-init:${node.location.start}:${node.location.end}`,
      node,
    )
    connectIncoming(context, incoming, initialization.id)
    loopIncoming = [{ id: initialization.id, kind: 'next' }]
  }

  const condition = flowNodeFor(context, node)
  connectIncoming(context, loopIncoming, condition.id)
  const exit = addSyntheticNode(
    context,
    'join',
    'Continue after loop',
    'loop exit',
    `for-exit:${node.location.start}:${node.location.end}`,
    node,
  )
  addEdge(context, condition.id, exit.id, 'exit')

  let bodyExits: Incoming[]
  if (node.body.length === 0) {
    bodyExits = [{ id: condition.id, kind: 'true' }]
  } else {
    bodyExits = buildSequence(context, node.body, [{ id: condition.id, kind: 'true' }])
  }

  if (node.update) {
    const update = addSyntheticNode(
      context,
      'statement',
      'Update loop',
      node.update.text,
      `for-update:${node.location.start}:${node.location.end}`,
      node,
    )
    connectIncoming(context, bodyExits, update.id)
    addEdge(context, update.id, condition.id, 'loop')
  } else {
    bodyExits.forEach((bodyExit) => addEdge(context, bodyExit.id, condition.id, 'loop'))
  }

  return [{ id: exit.id, kind: 'next' as const }]
}

function buildStructureNode(
  context: FlowContext,
  node: StructureNode,
  incoming: Incoming[],
): Incoming[] {
  if (node.kind === 'if') {
    return buildIf(context, node, incoming)
  }
  if (node.kind === 'for') {
    return buildFor(context, node, incoming)
  }

  const flowNode = flowNodeFor(context, node)
  connectIncoming(context, incoming, flowNode.id)
  return [{ id: flowNode.id, kind: 'next' }]
}

export function buildControlFlow(structure: StructureNode[]) {
  const context: FlowContext = {
    nodes: [
      {
        id: 'flow:start',
        kind: 'start',
        label: 'Start',
        technicalLabel: 'Program entry',
      },
    ],
    edges: [],
    nodeIds: createStableIdFactory(),
    edgeIds: createStableIdFactory(),
  }
  const exits = buildSequence(context, structure, [{ id: 'flow:start', kind: 'next' }])
  context.nodes.push({
    id: 'flow:end',
    kind: 'end',
    label: 'End',
    technicalLabel: 'Program exit',
  })
  connectIncoming(context, exits, 'flow:end')

  return {
    nodes: context.nodes,
    edges: context.edges,
  }
}
