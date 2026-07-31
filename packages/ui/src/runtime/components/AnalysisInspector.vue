<script setup lang="ts">
import type { AnalysisResult, Diagnostic, SourceLocation, VariableInfo } from '@fanoosjs/core'
import { ArrowDownLeft, ArrowUpRight, Braces, CircleDot, X } from '@lucide/vue'
import { computed } from 'vue'

import { useAnalysisSelection } from '../composables/useAnalysisSelection'
import { copy } from '../utils/copy'

const props = defineProps<{
  analysis: AnalysisResult
  drawer?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const selection = useAnalysisSelection()
const selectedVariable = computed(() =>
  props.analysis.variables.find(
    (variable) => variable.name === selection.selectedVariableName.value,
  ),
)
const selectedNode = computed(() => selection.selectedNode.value)
const selectedFlowNodes = computed(() =>
  selectedNode.value
    ? props.analysis.flow.nodes.filter(
        (flowNode) => flowNode.structureNodeId === selectedNode.value?.id,
      )
    : [],
)
const selectedFlowIds = computed(() => new Set(selectedFlowNodes.value.map((node) => node.id)))
const incomingEdges = computed(() =>
  props.analysis.flow.edges.filter((edge) => selectedFlowIds.value.has(edge.target)),
)
const outgoingEdges = computed(() =>
  props.analysis.flow.edges.filter((edge) => selectedFlowIds.value.has(edge.source)),
)

function locationsOverlap(left: SourceLocation, right: SourceLocation) {
  return left.start <= right.end && right.start <= left.end
}

const relatedDiagnostics = computed<Diagnostic[]>(() => {
  const location = selectedNode.value?.location ?? selectedVariable.value?.declaration
  if (!location) {
    return []
  }
  return props.analysis.diagnostics.filter(
    (diagnostic) => diagnostic.location && locationsOverlap(location, diagnostic.location),
  )
})

function variableTouchesNode(variable: VariableInfo, mode: 'read' | 'write') {
  const node = selectedNode.value
  if (!node) {
    return false
  }
  const locations =
    mode === 'read' ? variable.reads : variable.writes.map((write) => write.location)
  return locations.some((location) => locationsOverlap(node.location, location))
}

const nodeReads = computed(() =>
  props.analysis.variables.filter((variable) => variableTouchesNode(variable, 'read')),
)
const nodeWrites = computed(() =>
  props.analysis.variables.filter((variable) => variableTouchesNode(variable, 'write')),
)
</script>

<template>
  <aside
    class="fanoos-scrollbar h-full overflow-y-auto bg-[var(--fanoos-panel)]"
    :class="drawer ? 'w-[min(92vw,420px)] shadow-2xl' : 'border-t border-[var(--fanoos-line)]'"
    aria-label="Analysis inspector"
  >
    <header
      class="sticky top-0 z-10 flex h-10 items-center justify-between border-b border-[var(--fanoos-line)] bg-[var(--fanoos-panel)] px-4"
    >
      <div class="flex items-center gap-2">
        <Braces :size="13" class="text-[var(--fanoos-accent)]" />
        <h2 class="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--fanoos-muted)]">
          {{ copy.labels.inspector }}
        </h2>
      </div>
      <button
        v-if="drawer"
        type="button"
        class="rounded p-1 text-[var(--fanoos-muted)] hover:bg-[var(--fanoos-panel-muted)]"
        aria-label="Close inspector"
        @click="emit('close')"
      >
        <X :size="16" />
      </button>
    </header>

    <div v-if="selectedVariable" class="grid gap-4 p-4 lg:grid-cols-4">
      <section>
        <p class="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--fanoos-accent)]">
          Variable
        </p>
        <code class="mt-2 block text-base font-semibold">{{ selectedVariable.name }}</code>
        <p class="mt-1 text-[10px] text-[var(--fanoos-muted)]">
          Declared at line {{ selectedVariable.declaration.startLine }}
        </p>
      </section>
      <section>
        <p class="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--fanoos-muted)]">
          Initial value
        </p>
        <code class="mt-2 block text-xs">
          {{ selectedVariable.initialValue?.text || 'Uninitialized' }}
        </code>
      </section>
      <section>
        <p class="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--fanoos-muted)]">
          Access
        </p>
        <div class="mt-2 flex gap-4 text-xs">
          <span class="inline-flex items-center gap-1">
            <ArrowDownLeft :size="13" class="text-[#6f8fd5]" />
            {{ selectedVariable.reads.length }} reads
          </span>
          <span class="inline-flex items-center gap-1">
            <ArrowUpRight :size="13" class="text-[var(--fanoos-warning)]" />
            {{ selectedVariable.writes.length }} writes
          </span>
        </div>
      </section>
      <section>
        <p class="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--fanoos-muted)]">
          Context
        </p>
        <p class="mt-2 text-[10px] leading-4 text-[var(--fanoos-muted)]">
          {{ selectedVariable.contexts.join(' · ') }}
        </p>
      </section>
    </div>

    <div v-else-if="selectedNode" class="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-6">
      <section class="xl:col-span-2">
        <p class="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--fanoos-accent)]">
          {{ selectedNode.kind }}
        </p>
        <h3 class="mt-1 text-sm font-semibold">{{ selectedNode.label }}</h3>
        <code class="mt-1 block truncate text-[10px] text-[var(--fanoos-muted)]">
          {{ selectedNode.technicalLabel }}
        </code>
      </section>
      <section>
        <p class="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--fanoos-muted)]">
          {{ copy.labels.sourceRange }}
        </p>
        <p class="mt-2 font-mono text-[10px]">
          L{{ selectedNode.location.startLine }}:{{ selectedNode.location.startColumn }} → L{{
            selectedNode.location.endLine
          }}:{{ selectedNode.location.endColumn }}
        </p>
        <p class="mt-1 text-[10px] text-[var(--fanoos-muted)]">
          {{ copy.labels.confidence }}: {{ selectedNode.confidence }}
        </p>
      </section>
      <section>
        <p class="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--fanoos-muted)]">
          Variables
        </p>
        <p class="mt-2 text-[10px]">
          Reads:
          <code>{{ nodeReads.map((variable) => variable.name).join(', ') || 'None' }}</code>
        </p>
        <p class="mt-1 text-[10px]">
          Writes:
          <code>{{ nodeWrites.map((variable) => variable.name).join(', ') || 'None' }}</code>
        </p>
      </section>
      <section>
        <p class="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--fanoos-muted)]">
          Flow
        </p>
        <div class="mt-2 flex gap-3 text-[10px]">
          <span>{{ incomingEdges.length }} {{ copy.labels.incoming }}</span>
          <span>{{ outgoingEdges.length }} {{ copy.labels.outgoing }}</span>
        </div>
        <p class="mt-1 font-mono text-[9px] text-[var(--fanoos-muted)]">
          {{ outgoingEdges.map((edge) => edge.kind).join(' · ') || 'No outgoing edge' }}
        </p>
      </section>
      <section>
        <p class="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--fanoos-muted)]">
          Diagnostics
        </p>
        <p
          v-if="relatedDiagnostics.length === 0"
          class="mt-2 text-[10px] text-[var(--fanoos-muted)]"
        >
          None in this range
        </p>
        <p
          v-for="diagnostic in relatedDiagnostics"
          :key="diagnostic.id"
          class="mt-2 text-[10px] text-[var(--fanoos-warning)]"
        >
          {{ diagnostic.code }}
        </p>
      </section>
    </div>

    <div v-else class="grid gap-4 p-4 md:grid-cols-[1.2fr_repeat(5,0.5fr)]">
      <section class="md:col-span-1">
        <div class="flex items-center gap-2">
          <CircleDot :size="14" class="text-[var(--fanoos-accent)]" />
          <p class="text-xs font-semibold">{{ analysis.document.title }}</p>
        </div>
        <p class="mt-1 text-[10px] leading-4 text-[var(--fanoos-muted)]">
          {{ copy.states.noSelection }}
        </p>
      </section>
      <section
        v-for="metric in [
          ['Variables', analysis.summary.variableCount],
          ['Conditions', analysis.summary.conditionCount],
          ['Loops', analysis.summary.loopCount],
          ['Outputs', analysis.summary.outputCount],
          ['Diagnostics', analysis.diagnostics.length],
        ]"
        :key="metric[0]"
      >
        <p class="font-mono text-lg font-semibold">{{ metric[1] }}</p>
        <p class="text-[9px] uppercase tracking-[0.08em] text-[var(--fanoos-muted)]">
          {{ metric[0] }}
        </p>
      </section>
    </div>
  </aside>
</template>
