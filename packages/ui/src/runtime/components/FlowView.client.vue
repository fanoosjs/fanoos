<script setup lang="ts">
import type { AnalysisResult } from '@fanoosjs/core'
import { MarkerType, VueFlow, type NodeMouseEvent, type VueFlowStore } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { GitFork } from '@lucide/vue'
import { nextTick, shallowRef, watch } from 'vue'

import { useAnalysisSelection } from '../composables/useAnalysisSelection'
import { layoutFlow, type LaidOutFlow } from '../utils/layout-flow'

const props = defineProps<{
  analysis: AnalysisResult
}>()

const selection = useAnalysisSelection()
const graph = shallowRef<LaidOutFlow>({ nodes: [], edges: [] })
const flowStore = shallowRef<VueFlowStore>()
const layoutPending = shallowRef(true)

async function refreshLayout() {
  layoutPending.value = true
  graph.value = await layoutFlow(props.analysis.flow.nodes, props.analysis.flow.edges)
  layoutPending.value = false
  await nextTick()
  flowStore.value?.fitView({ padding: 0.18, duration: 250 })
}

function onInit(store: VueFlowStore) {
  flowStore.value = store
  nextTick(() => store.fitView({ padding: 0.18 }))
}

function flowNodeFromEvent(event: NodeMouseEvent) {
  const data = event.node.data as { flowNode?: AnalysisResult['flow']['nodes'][number] } | undefined
  return data?.flowNode
}

function onNodeClick(event: NodeMouseEvent) {
  selection.selectNode(flowNodeFromEvent(event)?.structureNodeId ?? null)
}

function onNodeEnter(event: NodeMouseEvent) {
  selection.hoverNode(flowNodeFromEvent(event)?.structureNodeId ?? null)
}

watch(
  () => props.analysis.flow,
  () => {
    void refreshLayout()
  },
  { immediate: true },
)
</script>

<template>
  <div class="relative h-full min-h-[520px] bg-[var(--fanoos-canvas)]">
    <div
      class="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-md border border-[var(--fanoos-line)] bg-[var(--fanoos-panel)]/95 px-3 py-2 shadow-sm"
    >
      <GitFork :size="14" class="text-[var(--fanoos-accent)]" />
      <div>
        <p class="text-[10px] font-semibold">Control flow</p>
        <p class="font-mono text-[8px] text-[var(--fanoos-muted)]">
          {{ analysis.flow.nodes.length }} nodes · {{ analysis.flow.edges.length }} edges
        </p>
      </div>
    </div>

    <ClientOnly>
      <VueFlow
        :nodes="graph.nodes"
        :edges="graph.edges"
        :nodes-draggable="false"
        :nodes-connectable="false"
        :elements-selectable="true"
        :zoom-on-double-click="false"
        :delete-key-code="null"
        :default-edge-options="{ markerEnd: MarkerType.ArrowClosed }"
        fit-view-on-init
        class="h-full"
        @init="onInit"
        @node-click="onNodeClick"
        @node-mouse-enter="onNodeEnter"
        @node-mouse-leave="selection.hoverNode(null)"
      >
        <template
          v-for="kind in [
            'start',
            'end',
            'statement',
            'condition',
            'loop',
            'join',
            'output',
            'unsupported',
          ]"
          #[`node-${kind}`]="slotProps"
          :key="kind"
        >
          <FlowNodeCard :data="slotProps.data" />
        </template>
        <Background :gap="24" :size="1" color="var(--fanoos-line-strong)" />
        <Controls position="bottom-left" />
        <MiniMap
          position="bottom-right"
          :pannable="true"
          :zoomable="true"
          node-color="var(--fanoos-accent)"
          mask-color="color-mix(in srgb, var(--fanoos-canvas) 75%, transparent)"
        />
      </VueFlow>
      <template #fallback>
        <div class="grid h-full place-items-center text-xs text-[var(--fanoos-muted)]">
          Preparing interactive graph…
        </div>
      </template>
    </ClientOnly>

    <div
      v-if="layoutPending"
      class="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-[var(--fanoos-canvas)]/70"
    >
      <span
        class="rounded-full border border-[var(--fanoos-line)] bg-[var(--fanoos-panel)] px-3 py-1.5 font-mono text-[9px] text-[var(--fanoos-muted)]"
      >
        Calculating layout…
      </span>
    </div>
  </div>
</template>
