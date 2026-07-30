import type { FlowEdge, FlowNode } from 'fanoos'
import type { Edge, Node } from '@vue-flow/core'
import type { ElkNode } from 'elkjs/lib/elk-api'

export interface FlowNodeData {
  flowNode: FlowNode
}

export interface LaidOutFlow {
  nodes: Array<Node<FlowNodeData>>
  edges: Edge[]
}

const NODE_WIDTH = 220
const NODE_HEIGHT = 76

export async function layoutFlow(nodes: FlowNode[], edges: FlowEdge[]): Promise<LaidOutFlow> {
  const { default: ELK } = await import('elkjs/lib/elk.bundled.js')
  const elk = new ELK()
  const graph: ElkNode = {
    id: 'fanoos-flow',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNode': '42',
      'elk.layered.spacing.nodeNodeBetweenLayers': '62',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.edgeRouting': 'ORTHOGONAL',
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: node.kind === 'start' || node.kind === 'end' ? 128 : NODE_WIDTH,
      height: node.kind === 'start' || node.kind === 'end' ? 44 : NODE_HEIGHT,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  }
  const layout = await elk.layout(graph)
  const positionById = new Map(
    layout.children?.map((node) => [node.id, { x: node.x ?? 0, y: node.y ?? 0 }]) ?? [],
  )

  return {
    nodes: nodes.map((flowNode) => ({
      id: flowNode.id,
      type: flowNode.kind,
      position: positionById.get(flowNode.id) ?? { x: 0, y: 0 },
      data: { flowNode },
      draggable: false,
      connectable: false,
      selectable: true,
      focusable: true,
      ariaLabel: `${flowNode.kind}: ${flowNode.label}`,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: 'smoothstep',
      animated: edge.kind === 'loop',
      selectable: false,
      focusable: false,
      data: { kind: edge.kind },
      class: `fanoos-edge-${edge.kind}`,
    })),
  }
}
