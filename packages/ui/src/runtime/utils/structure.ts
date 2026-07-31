import type { SourceLocation, StructureNode } from '@fanoosjs/core'

import type { FlatStructureNode } from '../types'

export function flattenStructure(
  nodes: StructureNode[],
  depth = 0,
  branch: FlatStructureNode['branch'] = 'root',
): FlatStructureNode[] {
  return nodes.flatMap((node) => {
    const current: FlatStructureNode = { node, depth, branch }
    if (node.kind === 'if') {
      return [
        current,
        ...flattenStructure(node.consequent, depth + 1, 'true'),
        ...flattenStructure(node.alternate, depth + 1, 'false'),
      ]
    }
    if (node.kind === 'for') {
      return [current, ...flattenStructure(node.body, depth + 1, 'loop')]
    }
    return [current]
  })
}

export function smallestNodeAtLine(
  nodes: StructureNode[],
  line: number,
): StructureNode | undefined {
  return flattenStructure(nodes)
    .map((item) => item.node)
    .filter((node) => node.location.startLine <= line && node.location.endLine >= line)
    .sort((left, right) => {
      const leftSize = left.location.end - left.location.start
      const rightSize = right.location.end - right.location.start
      return leftSize - rightSize
    })[0]
}

export function locationIncludesLine(location: SourceLocation, line: number): boolean {
  return location.startLine <= line && location.endLine >= line
}
