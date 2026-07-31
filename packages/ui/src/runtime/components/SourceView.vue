<script setup lang="ts">
import type { AnalysisResult, SourceLocation } from '@fanoosjs/core'
import { Check, Copy, FileCode2 } from 'lucide-vue-next'
import { computed, nextTick, shallowRef, watch } from 'vue'

import { useAnalysisSelection } from '../composables/useAnalysisSelection'
import type { SourceTokenSet } from '../types'
import { copy } from '../utils/copy'
import { flattenStructure, locationIncludesLine, smallestNodeAtLine } from '../utils/structure'

const props = defineProps<{
  analysis: AnalysisResult
  tokens: SourceTokenSet
  theme: 'light' | 'dark'
}>()

const selection = useAnalysisSelection()
const copied = shallowRef(false)
const lines = computed(() => props.tokens[props.theme])
const flatNodes = computed(() =>
  flattenStructure(props.analysis.structure).map((item) => item.node),
)
const selectedLocation = computed(() => selection.selectedNode.value?.location)
const hoveredLocation = computed(
  () => flatNodes.value.find((node) => node.id === selection.hoveredNodeId.value)?.location,
)
const selectedVariable = computed(() =>
  props.analysis.variables.find(
    (variable) => variable.name === selection.selectedVariableName.value,
  ),
)

function linesFor(locations: SourceLocation[]) {
  return new Set(
    locations.flatMap((location) => {
      const result: number[] = []
      for (let line = location.startLine; line <= location.endLine; line += 1) {
        result.push(line)
      }
      return result
    }),
  )
}

const variableDeclarationLines = computed(() =>
  selectedVariable.value ? linesFor([selectedVariable.value.declaration]) : new Set<number>(),
)
const variableReadLines = computed(() =>
  selectedVariable.value ? linesFor(selectedVariable.value.reads) : new Set<number>(),
)
const variableWriteLines = computed(() =>
  selectedVariable.value
    ? linesFor(selectedVariable.value.writes.map((write) => write.location))
    : new Set<number>(),
)
const diagnosticLines = computed(
  () =>
    new Set(
      props.analysis.diagnostics
        .map((diagnostic) => diagnostic.location?.startLine)
        .filter((line): line is number => line !== undefined),
    ),
)

function lineClasses(line: number) {
  return {
    'bg-[var(--fanoos-accent-soft)]': selectedLocation.value
      ? locationIncludesLine(selectedLocation.value, line)
      : false,
    'bg-[color-mix(in_srgb,var(--fanoos-accent-soft)_55%,transparent)]':
      !selectedLocation.value &&
      hoveredLocation.value !== undefined &&
      locationIncludesLine(hoveredLocation.value, line),
    'border-l-[var(--fanoos-accent)]': variableDeclarationLines.value.has(line),
    'border-l-[#6f8fd5]': variableReadLines.value.has(line),
    'border-l-[var(--fanoos-warning)]': variableWriteLines.value.has(line),
  }
}

function tokenStyle(token: { color?: string; fontStyle?: number }) {
  const fontStyle = token.fontStyle ?? 0
  return {
    color: token.color,
    fontStyle: fontStyle & 1 ? 'italic' : undefined,
    fontWeight: fontStyle & 2 ? '700' : undefined,
    textDecoration: fontStyle & 4 ? 'underline' : undefined,
  }
}

function selectLine(line: number) {
  selection.selectNode(smallestNodeAtLine(props.analysis.structure, line)?.id ?? null)
}

async function copySource() {
  await navigator.clipboard.writeText(props.analysis.document.source)
  copied.value = true
  window.setTimeout(() => {
    copied.value = false
  }, 1600)
}

function scrollToLine(line: number | undefined) {
  if (!line) {
    return
  }
  nextTick(() => {
    document
      .getElementById(`fanoos-source-line-${line}`)
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
}

watch(
  () => selectedLocation.value?.startLine,
  (line) => scrollToLine(line),
)
watch(
  () => selectedVariable.value?.declaration.startLine,
  (line) => scrollToLine(line),
)
</script>

<template>
  <div class="flex h-full min-h-0 flex-col bg-[var(--fanoos-code)]">
    <header
      class="flex h-11 shrink-0 items-center gap-2 border-b border-[var(--fanoos-line)] bg-[var(--fanoos-panel)] px-4"
    >
      <FileCode2 :size="14" class="text-[var(--fanoos-accent)]" />
      <span class="flex-1 truncate font-mono text-[10px] font-semibold">
        {{ analysis.document.filename }}
      </span>
      <div
        v-if="selectedVariable"
        class="hidden items-center gap-2 font-mono text-[9px] text-[var(--fanoos-muted)] sm:flex"
      >
        <span class="size-1.5 rounded-full bg-[var(--fanoos-accent)]" /> declaration
        <span class="size-1.5 rounded-full bg-[#6f8fd5]" /> read
        <span class="size-1.5 rounded-full bg-[var(--fanoos-warning)]" /> write
      </div>
      <button
        type="button"
        class="ml-2 inline-flex items-center gap-1.5 rounded border border-[var(--fanoos-line)] px-2 py-1.5 text-[10px] font-semibold hover:bg-[var(--fanoos-panel-muted)]"
        @click="copySource"
      >
        <Check v-if="copied" :size="12" class="text-[var(--fanoos-accent)]" />
        <Copy v-else :size="12" />
        {{ copied ? copy.actions.copied : copy.actions.copySource }}
      </button>
    </header>

    <div class="fanoos-scrollbar min-h-0 flex-1 overflow-auto py-3 font-mono text-[12px] leading-6">
      <button
        v-for="(lineTokens, index) in lines"
        :id="`fanoos-source-line-${index + 1}`"
        :key="index"
        type="button"
        class="group flex min-h-6 w-full border-l-2 border-transparent text-left whitespace-pre hover:bg-[var(--fanoos-panel-muted)]"
        :class="lineClasses(index + 1)"
        @click="selectLine(index + 1)"
      >
        <span
          class="sticky left-0 z-10 inline-flex w-14 shrink-0 select-none items-center justify-end gap-2 bg-[var(--fanoos-code)] pr-3 text-[10px] text-[var(--fanoos-muted)]"
        >
          <span
            v-if="diagnosticLines.has(index + 1)"
            class="size-1.5 rounded-full bg-[var(--fanoos-warning)]"
            aria-label="Diagnostic on this line"
          />
          {{ index + 1 }}
        </span>
        <code class="block min-w-max pr-8">
          <span
            v-for="(token, tokenIndex) in lineTokens"
            :key="tokenIndex"
            :style="tokenStyle(token)"
            >{{ token.content }}</span
          >
        </code>
      </button>
    </div>
  </div>
</template>
