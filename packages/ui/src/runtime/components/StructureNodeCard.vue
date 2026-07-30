<script setup lang="ts">
import type { StructureNode } from 'fanoos'
import {
  ChevronDown,
  CircleDot,
  GitMerge,
  IterationCw,
  Split,
  TerminalSquare,
  TriangleAlert,
} from 'lucide-vue-next'
import { computed, shallowRef } from 'vue'

import { useAnalysisSelection } from '../composables/useAnalysisSelection'
import { copy } from '../utils/copy'

const props = defineProps<{
  node: StructureNode
  depth?: number
}>()

const selection = useAnalysisSelection()
const collapsed = shallowRef(false)
const isSelected = computed(() => selection.selectedNodeId.value === props.node.id)

function selectNode() {
  selection.selectNode(props.node.id)
}

function toggle(event: MouseEvent) {
  event.stopPropagation()
  collapsed.value = !collapsed.value
}

function nodeTone(node: StructureNode) {
  if (node.kind === 'unsupported') {
    return 'border-[var(--fanoos-warning)]'
  }
  if (node.kind === 'output') {
    return 'border-l-[var(--fanoos-accent)]'
  }
  return 'border-[var(--fanoos-line)]'
}
</script>

<template>
  <article
    v-if="node.kind === 'if'"
    class="overflow-hidden rounded-lg border bg-[var(--fanoos-panel)] transition-shadow"
    :class="[
      isSelected
        ? 'border-[var(--fanoos-accent)] ring-2 ring-[var(--fanoos-accent-soft)]'
        : 'border-[var(--fanoos-line)]',
    ]"
    :data-node-id="node.id"
    @mouseenter="selection.hoverNode(node.id)"
    @mouseleave="selection.hoverNode(null)"
  >
    <div
      role="button"
      tabindex="0"
      class="flex w-full items-center gap-3 border-b border-[var(--fanoos-line)] bg-[var(--fanoos-panel-muted)] px-4 py-3 text-left"
      @click="selectNode"
      @keydown.enter="selectNode"
      @keydown.space.prevent="selectNode"
    >
      <span
        class="flex size-8 shrink-0 items-center justify-center rounded-md border border-[var(--fanoos-accent)] bg-[var(--fanoos-accent-soft)] text-[var(--fanoos-accent)]"
      >
        <Split :size="16" />
      </span>
      <span class="min-w-0 flex-1">
        <span
          class="block font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--fanoos-accent)]"
        >
          Condition · L{{ node.location.startLine }}–{{ node.location.endLine }}
        </span>
        <code class="mt-1 block truncate text-xs">{{ node.condition.text }}</code>
      </span>
      <button
        type="button"
        class="rounded p-1.5 text-[var(--fanoos-muted)] hover:bg-[var(--fanoos-panel)]"
        :aria-label="collapsed ? 'Expand condition' : 'Collapse condition'"
        @click="toggle"
      >
        <ChevronDown :size="15" :class="{ '-rotate-90': collapsed }" />
      </button>
    </div>

    <div v-if="!collapsed" class="p-3 sm:p-4">
      <div class="grid gap-3 md:grid-cols-2">
        <section
          class="min-w-0 rounded-md border border-[var(--fanoos-line)] bg-[var(--fanoos-panel-muted)]"
        >
          <header
            class="flex items-center gap-2 border-b border-[var(--fanoos-line)] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--fanoos-accent)]"
          >
            <span class="size-1.5 rounded-full bg-[var(--fanoos-accent)]" />
            True branch
          </header>
          <div class="space-y-3 p-3">
            <StructureNodeCard
              v-for="child in node.consequent"
              :key="child.id"
              :node="child"
              :depth="(depth ?? 0) + 1"
            />
            <p
              v-if="node.consequent.length === 0"
              class="rounded border border-dashed border-[var(--fanoos-line-strong)] p-3 text-center font-mono text-[10px] text-[var(--fanoos-muted)]"
            >
              {{ copy.states.noOperation }}
            </p>
          </div>
        </section>

        <section
          class="min-w-0 rounded-md border border-[var(--fanoos-line)] bg-[var(--fanoos-panel-muted)]"
        >
          <header
            class="flex items-center gap-2 border-b border-[var(--fanoos-line)] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--fanoos-muted)]"
          >
            <span class="size-1.5 rounded-full bg-[var(--fanoos-line-strong)]" />
            False branch
          </header>
          <div class="space-y-3 p-3">
            <StructureNodeCard
              v-for="child in node.alternate"
              :key="child.id"
              :node="child"
              :depth="(depth ?? 0) + 1"
            />
            <p
              v-if="node.alternate.length === 0"
              class="rounded border border-dashed border-[var(--fanoos-line-strong)] p-3 text-center font-mono text-[10px] text-[var(--fanoos-muted)]"
            >
              {{ copy.states.noOperation }}
            </p>
          </div>
        </section>
      </div>
      <div class="mt-3 flex items-center gap-2 text-[var(--fanoos-muted)]">
        <span class="h-px flex-1 bg-[var(--fanoos-line)]" />
        <GitMerge :size="13" />
        <span class="font-mono text-[9px] uppercase tracking-[0.1em]">Merge</span>
        <span class="h-px flex-1 bg-[var(--fanoos-line)]" />
      </div>
    </div>
  </article>

  <article
    v-else-if="node.kind === 'for'"
    class="relative overflow-hidden rounded-xl border bg-[var(--fanoos-panel)]"
    :class="
      isSelected
        ? 'border-[var(--fanoos-accent)] ring-2 ring-[var(--fanoos-accent-soft)]'
        : 'border-[var(--fanoos-line-strong)]'
    "
    :data-node-id="node.id"
    @mouseenter="selection.hoverNode(node.id)"
    @mouseleave="selection.hoverNode(null)"
  >
    <div
      class="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[repeating-linear-gradient(180deg,var(--fanoos-accent)_0,var(--fanoos-accent)_7px,transparent_7px,transparent_11px)]"
      aria-hidden="true"
    />
    <div
      role="button"
      tabindex="0"
      class="flex w-full items-start gap-3 border-b border-[var(--fanoos-line)] bg-[var(--fanoos-panel-muted)] py-3 pl-5 pr-4 text-left"
      @click="selectNode"
      @keydown.enter="selectNode"
      @keydown.space.prevent="selectNode"
    >
      <span
        class="flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--fanoos-accent)] bg-[var(--fanoos-accent-soft)] text-[var(--fanoos-accent)]"
      >
        <IterationCw :size="16" />
      </span>
      <span class="min-w-0 flex-1">
        <span
          class="block font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--fanoos-accent)]"
        >
          For loop · L{{ node.location.startLine }}–{{ node.location.endLine }}
        </span>
        <span class="mt-1 block text-sm font-semibold">
          Repeat while {{ node.condition?.text || 'condition is present' }}
        </span>
      </span>
      <button
        type="button"
        class="rounded p-1.5 text-[var(--fanoos-muted)] hover:bg-[var(--fanoos-panel)]"
        :aria-label="collapsed ? 'Expand loop' : 'Collapse loop'"
        @click="toggle"
      >
        <ChevronDown :size="15" :class="{ '-rotate-90': collapsed }" />
      </button>
    </div>

    <div v-if="!collapsed" class="pl-1">
      <dl class="grid gap-px bg-[var(--fanoos-line)] sm:grid-cols-3">
        <div class="bg-[var(--fanoos-panel)] px-4 py-3">
          <dt
            class="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-[var(--fanoos-muted)]"
          >
            Initialization
          </dt>
          <dd class="mt-1 truncate font-mono text-[10px]">
            {{ node.initialization?.text || 'None' }}
          </dd>
        </div>
        <div class="bg-[var(--fanoos-panel)] px-4 py-3">
          <dt
            class="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-[var(--fanoos-muted)]"
          >
            Condition
          </dt>
          <dd class="mt-1 truncate font-mono text-[10px]">
            {{ node.condition?.text || 'Always' }}
          </dd>
        </div>
        <div class="bg-[var(--fanoos-panel)] px-4 py-3">
          <dt
            class="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-[var(--fanoos-muted)]"
          >
            Update
          </dt>
          <dd class="mt-1 truncate font-mono text-[10px]">
            {{ node.update?.text || 'None' }}
          </dd>
        </div>
      </dl>
      <section
        class="m-3 rounded-lg border border-dashed border-[var(--fanoos-accent)] bg-[var(--fanoos-accent-soft)]/20 p-3"
      >
        <header
          class="mb-3 flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--fanoos-accent)]"
        >
          <IterationCw :size="12" />
          Loop body
          <span class="h-px flex-1 bg-[var(--fanoos-accent)] opacity-25" />
        </header>
        <div class="space-y-3">
          <StructureNodeCard
            v-for="child in node.body"
            :key="child.id"
            :node="child"
            :depth="(depth ?? 0) + 1"
          />
          <p
            v-if="node.body.length === 0"
            class="rounded border border-dashed border-[var(--fanoos-line-strong)] bg-[var(--fanoos-panel)] p-3 text-center font-mono text-[10px] text-[var(--fanoos-muted)]"
          >
            {{ copy.states.noOperation }}
          </p>
        </div>
      </section>
    </div>
  </article>

  <button
    v-else
    type="button"
    class="flex w-full items-start gap-3 rounded-md border-l-2 bg-[var(--fanoos-panel)] px-3 py-3 text-left transition-colors hover:bg-[var(--fanoos-panel-muted)]"
    :class="[
      nodeTone(node),
      isSelected
        ? 'ring-2 ring-[var(--fanoos-accent-soft)]'
        : 'border-y border-r border-y-[var(--fanoos-line)] border-r-[var(--fanoos-line)]',
    ]"
    :data-node-id="node.id"
    @click="selectNode"
    @mouseenter="selection.hoverNode(node.id)"
    @mouseleave="selection.hoverNode(null)"
  >
    <span class="mt-0.5 text-[var(--fanoos-accent)]">
      <TerminalSquare v-if="node.kind === 'output'" :size="15" />
      <TriangleAlert v-else-if="node.kind === 'unsupported'" :size="15" />
      <CircleDot v-else :size="15" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block text-xs font-semibold">{{ node.label }}</span>
      <code class="mt-1 block truncate text-[10px] text-[var(--fanoos-muted)]">
        {{ node.technicalLabel }}
      </code>
    </span>
    <span class="font-mono text-[9px] text-[var(--fanoos-muted)]">
      L{{ node.location.startLine }}
    </span>
  </button>
</template>
