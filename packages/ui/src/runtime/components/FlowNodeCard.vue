<script setup lang="ts">
import type { FlowNode } from '@fanoosjs/core'
import {
  Circle,
  CircleStop,
  GitMerge,
  IterationCw,
  Play,
  Split,
  TerminalSquare,
  TriangleAlert,
} from 'lucide-vue-next'
import { computed } from 'vue'

import { useAnalysisSelection } from '../composables/useAnalysisSelection'

const props = defineProps<{
  data: {
    flowNode: FlowNode
  }
}>()

const selection = useAnalysisSelection()
const node = computed(() => props.data.flowNode)
const isSelected = computed(
  () =>
    node.value.structureNodeId !== undefined &&
    selection.selectedNodeId.value === node.value.structureNodeId,
)

const iconByKind = {
  start: Play,
  end: CircleStop,
  statement: Circle,
  condition: Split,
  loop: IterationCw,
  join: GitMerge,
  output: TerminalSquare,
  unsupported: TriangleAlert,
}
</script>

<template>
  <div
    class="group relative min-w-[128px] max-w-[220px] border bg-[var(--fanoos-panel)] text-[var(--fanoos-ink)] shadow-sm transition-shadow"
    :class="[
      node.kind === 'start' || node.kind === 'end'
        ? 'rounded-full px-4 py-2'
        : 'rounded-lg px-3 py-2.5',
      node.kind === 'condition'
        ? 'border-[var(--fanoos-accent)] [clip-path:polygon(8px_0,calc(100%-8px)_0,100%_50%,calc(100%-8px)_100%,8px_100%,0_50%)]'
        : node.kind === 'unsupported'
          ? 'border-[var(--fanoos-warning)]'
          : 'border-[var(--fanoos-line-strong)]',
      isSelected
        ? 'ring-2 ring-[var(--fanoos-accent)] ring-offset-2 ring-offset-[var(--fanoos-canvas)]'
        : '',
    ]"
  >
    <div class="flex items-center gap-2">
      <span
        class="flex size-6 shrink-0 items-center justify-center rounded-md bg-[var(--fanoos-accent-soft)] text-[var(--fanoos-accent)]"
      >
        <component :is="iconByKind[node.kind]" :size="13" />
      </span>
      <span class="min-w-0">
        <span
          class="block font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-[var(--fanoos-muted)]"
        >
          {{ node.kind }}
        </span>
        <span class="block truncate text-[11px] font-semibold">{{ node.label }}</span>
      </span>
    </div>
    <code
      v-if="node.kind !== 'start' && node.kind !== 'end'"
      class="mt-1.5 block truncate border-t border-[var(--fanoos-line)] pt-1.5 text-[8px] text-[var(--fanoos-muted)]"
    >
      {{ node.technicalLabel }}
    </code>
    <span
      v-if="node.kind === 'loop'"
      class="absolute -right-2 -top-2 rounded-full bg-[var(--fanoos-accent)] px-1.5 py-0.5 font-mono text-[7px] font-bold uppercase text-white"
    >
      loop
    </span>
  </div>
</template>
