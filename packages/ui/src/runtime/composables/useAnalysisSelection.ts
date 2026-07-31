import type { AnalysisResult, StructureNode } from '@fanoosjs/core'
import {
  computed,
  inject,
  provide,
  readonly,
  shallowRef,
  type ComputedRef,
  type InjectionKey,
  type Ref,
} from 'vue'

import { flattenStructure } from '../utils/structure'

export interface AnalysisSelectionState {
  selectedNodeId: Readonly<Ref<string | null>>
  hoveredNodeId: Readonly<Ref<string | null>>
  selectedVariableName: Readonly<Ref<string | null>>
  selectedNode: ComputedRef<StructureNode | undefined>
  selectNode(id: string | null): void
  hoverNode(id: string | null): void
  selectVariable(name: string | null): void
}

export const analysisSelectionKey: InjectionKey<AnalysisSelectionState> = Symbol('fanoos-selection')

export function createAnalysisSelection(
  analysis: Readonly<Ref<AnalysisResult | null>>,
): AnalysisSelectionState {
  const selectedNodeId = shallowRef<string | null>(null)
  const hoveredNodeId = shallowRef<string | null>(null)
  const selectedVariableName = shallowRef<string | null>(null)
  const selectedNode = computed(() => {
    const id = selectedNodeId.value
    if (!id || !analysis.value) {
      return undefined
    }
    return flattenStructure(analysis.value.structure).find((item) => item.node.id === id)?.node
  })

  function selectNode(id: string | null) {
    selectedNodeId.value = id
    if (id) {
      selectedVariableName.value = null
    }
  }

  function hoverNode(id: string | null) {
    hoveredNodeId.value = id
  }

  function selectVariable(name: string | null) {
    selectedVariableName.value = name
    if (name) {
      selectedNodeId.value = null
    }
  }

  return {
    selectedNodeId: readonly(selectedNodeId),
    hoveredNodeId: readonly(hoveredNodeId),
    selectedVariableName: readonly(selectedVariableName),
    selectedNode,
    selectNode,
    hoverNode,
    selectVariable,
  }
}

export function provideAnalysisSelection(selection: AnalysisSelectionState) {
  provide(analysisSelectionKey, selection)
}

export function useAnalysisSelection(): AnalysisSelectionState {
  const selection = inject(analysisSelectionKey)
  if (!selection) {
    throw new Error('Fanoos selection state is not available.')
  }
  return selection
}
