<script setup lang="ts">
import type { AnalysisResult, Diagnostic, StructureNode } from '@fanoosjs/core'
import {
  AlertTriangle,
  Braces,
  FileCode2,
  GitBranch,
  IterationCw,
  TerminalSquare,
  Variable,
} from '@lucide/vue'

import { useAnalysisSelection } from '../composables/useAnalysisSelection'
import { copy } from '../utils/copy'
import { smallestNodeAtLine } from '../utils/structure'

const props = defineProps<{
  analysis: AnalysisResult
}>()

const emit = defineEmits<{
  openSource: []
}>()

const selection = useAnalysisSelection()

function selectStep(node: StructureNode) {
  selection.selectNode(node.id)
  emit('openSource')
}

function selectDiagnostic(diagnostic: Diagnostic) {
  const node = diagnostic.location
    ? smallestNodeAtLine(props.analysis.structure, diagnostic.location.startLine)?.id
    : undefined
  if (node) {
    selection.selectNode(node)
  }
}

const statIcons = {
  Variables: Variable,
  Conditions: GitBranch,
  Loops: IterationCw,
  Outputs: TerminalSquare,
  Unsupported: AlertTriangle,
}
</script>

<template>
  <div class="fanoos-scrollbar h-full overflow-y-auto p-4 sm:p-6 xl:p-8">
    <div class="mx-auto max-w-5xl">
      <section class="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.7fr)]">
        <div
          class="relative overflow-hidden border border-[var(--fanoos-line)] bg-[var(--fanoos-panel)] p-5 sm:p-7"
        >
          <div class="absolute inset-y-0 left-0 w-1 bg-[var(--fanoos-accent)]" aria-hidden="true" />
          <div class="flex items-center gap-2 text-[var(--fanoos-muted)]">
            <FileCode2 :size="15" />
            <span class="font-mono text-[10px] uppercase tracking-[0.12em]">
              {{ analysis.document.filename }}
            </span>
          </div>
          <h2 class="mt-4 max-w-3xl text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
            {{ analysis.document.title }}
          </h2>
          <p
            v-if="analysis.document.description"
            class="mt-3 max-w-3xl text-sm leading-6 text-[var(--fanoos-muted)]"
          >
            {{ analysis.document.description }}
          </p>
        </div>

        <div
          class="border border-[var(--fanoos-line)] bg-[var(--fanoos-ink)] p-5 text-[var(--fanoos-panel)]"
        >
          <p class="font-mono text-[9px] font-bold uppercase tracking-[0.14em] opacity-65">
            {{ copy.labels.generatedSummary }}
          </p>
          <p class="mt-3 text-sm leading-6">{{ analysis.summary.text }}</p>
          <div class="mt-5 h-px bg-current opacity-15" />
          <p class="mt-4 text-[10px] leading-4 opacity-60">
            Generated from structural counts only. No source code was executed.
          </p>
        </div>
      </section>

      <section class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <div
          v-for="stat in [
            { label: 'Variables', value: analysis.summary.variableCount },
            { label: 'Conditions', value: analysis.summary.conditionCount },
            { label: 'Loops', value: analysis.summary.loopCount },
            { label: 'Outputs', value: analysis.summary.outputCount },
            { label: 'Unsupported', value: analysis.summary.unsupportedCount },
          ]"
          :key="stat.label"
          class="border border-[var(--fanoos-line)] bg-[var(--fanoos-panel)] p-3"
        >
          <component
            :is="statIcons[stat.label as keyof typeof statIcons]"
            :size="14"
            class="text-[var(--fanoos-accent)]"
          />
          <p class="mt-3 font-mono text-xl font-semibold">{{ stat.value }}</p>
          <p class="text-[10px] uppercase tracking-[0.08em] text-[var(--fanoos-muted)]">
            {{ stat.label }}
          </p>
        </div>
      </section>

      <div class="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <section class="border border-[var(--fanoos-line)] bg-[var(--fanoos-panel)]">
          <header
            class="flex items-center justify-between border-b border-[var(--fanoos-line)] px-4 py-3"
          >
            <div>
              <p
                class="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--fanoos-muted)]"
              >
                Program order
              </p>
              <h3 class="mt-0.5 text-sm font-semibold">{{ copy.labels.topLevelSteps }}</h3>
            </div>
            <Braces :size="16" class="text-[var(--fanoos-muted)]" />
          </header>
          <ol class="divide-y divide-[var(--fanoos-line)]">
            <li v-for="(node, index) in analysis.structure" :key="node.id">
              <button
                type="button"
                class="group flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[var(--fanoos-panel-muted)]"
                @click="selectStep(node)"
              >
                <span
                  class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-[var(--fanoos-line)] font-mono text-[9px] text-[var(--fanoos-muted)] group-hover:border-[var(--fanoos-accent)] group-hover:text-[var(--fanoos-accent)]"
                >
                  {{ String(index + 1).padStart(2, '0') }}
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block text-sm font-medium">{{ node.label }}</span>
                  <code class="mt-1 block truncate text-[10px] text-[var(--fanoos-muted)]">
                    {{ node.technicalLabel }}
                  </code>
                </span>
                <span class="font-mono text-[9px] text-[var(--fanoos-muted)]">
                  L{{ node.location.startLine }}
                </span>
              </button>
            </li>
          </ol>
        </section>

        <div class="space-y-4">
          <section
            v-if="analysis.document.jsdoc"
            class="border border-[var(--fanoos-line)] bg-[var(--fanoos-panel)] p-4"
          >
            <p class="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--fanoos-accent)]">
              {{ copy.labels.authorDocumentation }}
            </p>
            <p class="mt-3 text-sm font-semibold">{{ analysis.document.jsdoc.summary }}</p>
            <p
              v-if="analysis.document.jsdoc.body"
              class="mt-2 whitespace-pre-line text-xs leading-5 text-[var(--fanoos-muted)]"
            >
              {{ analysis.document.jsdoc.body }}
            </p>
            <div v-if="analysis.document.jsdoc.tags.length" class="mt-3 flex flex-wrap gap-1.5">
              <span
                v-for="tag in analysis.document.jsdoc.tags"
                :key="`${tag.name}:${tag.value}`"
                class="rounded border border-[var(--fanoos-line)] px-2 py-1 font-mono text-[9px] text-[var(--fanoos-muted)]"
              >
                @{{ tag.name }} {{ tag.value }}
              </span>
            </div>
          </section>

          <section class="border border-[var(--fanoos-line)] bg-[var(--fanoos-panel)] p-4">
            <p class="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--fanoos-muted)]">
              Diagnostics
            </p>
            <div class="mt-3">
              <DiagnosticsPanel :diagnostics="analysis.diagnostics" @select="selectDiagnostic" />
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
