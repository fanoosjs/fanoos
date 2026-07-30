<script setup lang="ts">
import type { AnalysisResult, Diagnostic, StructureNode } from 'fanoos'
import {
  AlertTriangle,
  ChevronDown,
  CircleDot,
  GitBranch,
  IterationCw,
  TerminalSquare,
  Variable,
  X,
} from 'lucide-vue-next'
import { computed } from 'vue'

import { useAnalysisSelection } from '../composables/useAnalysisSelection'
import { copy } from '../utils/copy'
import { flattenStructure, smallestNodeAtLine } from '../utils/structure'

const props = defineProps<{
  analysis: AnalysisResult
  drawer?: boolean
}>()

const emit = defineEmits<{
  close: []
  navigate: []
}>()

const selection = useAnalysisSelection()
const flatNodes = computed(() =>
  flattenStructure(props.analysis.structure).map((item) => item.node),
)
const conditions = computed(() => flatNodes.value.filter((node) => node.kind === 'if'))
const loops = computed(() => flatNodes.value.filter((node) => node.kind === 'for'))
const outputs = computed(() => flatNodes.value.filter((node) => node.kind === 'output'))

function selectNode(node: StructureNode) {
  selection.selectNode(node.id)
  emit('navigate')
}

function selectVariable(name: string) {
  selection.selectVariable(name)
  emit('navigate')
}

function selectDiagnostic(diagnostic: Diagnostic) {
  if (diagnostic.location) {
    const node = smallestNodeAtLine(props.analysis.structure, diagnostic.location.startLine)
    selection.selectNode(node?.id ?? null)
  }
  emit('navigate')
}

const sections = computed(() => [
  { label: copy.navigation.conditions, count: conditions.value.length, icon: GitBranch },
  { label: copy.navigation.loops, count: loops.value.length, icon: IterationCw },
  { label: copy.navigation.outputs, count: outputs.value.length, icon: TerminalSquare },
])
</script>

<template>
  <aside
    class="fanoos-scrollbar h-full overflow-y-auto border-r border-[var(--fanoos-line)] bg-[var(--fanoos-panel)]"
    :class="drawer ? 'w-[min(88vw,320px)] shadow-2xl' : 'w-full'"
    aria-label="Analysis navigator"
  >
    <div
      class="sticky top-0 z-10 flex h-11 items-center justify-between border-b border-[var(--fanoos-line)] bg-[var(--fanoos-panel)] px-4"
    >
      <h2 class="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--fanoos-muted)]">
        {{ copy.navigation.title }}
      </h2>
      <button
        v-if="drawer"
        type="button"
        class="rounded p-1 text-[var(--fanoos-muted)] hover:bg-[var(--fanoos-panel-muted)]"
        aria-label="Close navigator"
        @click="emit('close')"
      >
        <X :size="16" />
      </button>
    </div>

    <details open class="group border-b border-[var(--fanoos-line)]">
      <summary
        class="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-xs font-semibold [&::-webkit-details-marker]:hidden"
      >
        <Variable :size="14" class="text-[var(--fanoos-accent)]" />
        <span class="flex-1">{{ copy.navigation.variables }}</span>
        <span class="font-mono text-[10px] text-[var(--fanoos-muted)]">
          {{ analysis.variables.length }}
        </span>
        <ChevronDown :size="13" class="transition-transform group-open:rotate-180" />
      </summary>
      <div class="space-y-1 px-2 pb-3">
        <button
          v-for="variable in analysis.variables"
          :key="variable.name"
          type="button"
          class="w-full rounded-md border border-transparent px-2 py-2 text-left hover:border-[var(--fanoos-line)] hover:bg-[var(--fanoos-panel-muted)]"
          :class="{
            'border-[var(--fanoos-accent)]! bg-[var(--fanoos-accent-soft)]!':
              selection.selectedVariableName.value === variable.name,
          }"
          @click="selectVariable(variable.name)"
        >
          <span class="flex items-center gap-2">
            <CircleDot :size="11" class="text-[var(--fanoos-accent)]" />
            <code class="text-xs font-semibold">{{ variable.name }}</code>
            <span class="ml-auto font-mono text-[9px] text-[var(--fanoos-muted)]">
              L{{ variable.declaration.startLine }}
            </span>
          </span>
          <span class="mt-1 block pl-[19px] text-[10px] text-[var(--fanoos-muted)]">
            {{ variable.reads.length }} reads · {{ variable.writes.length }} writes
          </span>
        </button>
      </div>
    </details>

    <template v-for="section in sections" :key="section.label">
      <details open class="group border-b border-[var(--fanoos-line)]">
        <summary
          class="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-xs font-semibold [&::-webkit-details-marker]:hidden"
        >
          <component :is="section.icon" :size="14" class="text-[var(--fanoos-accent)]" />
          <span class="flex-1">{{ section.label }}</span>
          <span class="font-mono text-[10px] text-[var(--fanoos-muted)]">{{ section.count }}</span>
          <ChevronDown :size="13" class="transition-transform group-open:rotate-180" />
        </summary>
        <div class="space-y-1 px-2 pb-3">
          <button
            v-for="node in section.label === copy.navigation.conditions
              ? conditions
              : section.label === copy.navigation.loops
                ? loops
                : outputs"
            :key="node.id"
            type="button"
            class="flex w-full items-start gap-2 rounded-md border border-transparent px-2 py-2 text-left hover:border-[var(--fanoos-line)] hover:bg-[var(--fanoos-panel-muted)]"
            :class="{
              'border-[var(--fanoos-accent)]! bg-[var(--fanoos-accent-soft)]!':
                selection.selectedNodeId.value === node.id,
            }"
            @click="selectNode(node)"
          >
            <span class="mt-1 size-1.5 shrink-0 rounded-full bg-[var(--fanoos-accent)]" />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-xs">{{ node.label }}</span>
              <span class="font-mono text-[9px] text-[var(--fanoos-muted)]">
                Line {{ node.location.startLine }}
              </span>
            </span>
          </button>
        </div>
      </details>
    </template>

    <details open class="group">
      <summary
        class="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-xs font-semibold [&::-webkit-details-marker]:hidden"
      >
        <AlertTriangle :size="14" class="text-[var(--fanoos-warning)]" />
        <span class="flex-1">{{ copy.navigation.diagnostics }}</span>
        <span class="font-mono text-[10px] text-[var(--fanoos-muted)]">
          {{ analysis.diagnostics.length }}
        </span>
        <ChevronDown :size="13" class="transition-transform group-open:rotate-180" />
      </summary>
      <div class="px-2 pb-3">
        <DiagnosticsPanel :diagnostics="analysis.diagnostics" compact @select="selectDiagnostic" />
      </div>
    </details>
  </aside>
</template>
