<script setup lang="ts">
import { Braces, GitFork, Layers3, Telescope } from 'lucide-vue-next'

import { copy } from '../utils/copy'

export type AnalysisTab = keyof typeof copy.tabs

defineProps<{
  activeTab: AnalysisTab
}>()

const emit = defineEmits<{
  select: [tab: AnalysisTab]
}>()

const tabs = [
  { id: 'overview', label: copy.tabs.overview, icon: Telescope },
  { id: 'flow', label: copy.tabs.flow, icon: GitFork },
  { id: 'structure', label: copy.tabs.structure, icon: Layers3 },
  { id: 'source', label: copy.tabs.source, icon: Braces },
] as const
</script>

<template>
  <nav
    class="flex h-11 items-stretch gap-1 overflow-x-auto border-b border-[var(--fanoos-line)] bg-[var(--fanoos-panel)] px-3"
    aria-label="Analysis views"
  >
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      class="relative inline-flex min-w-max items-center gap-2 px-3 text-xs font-semibold text-[var(--fanoos-muted)] transition-colors hover:text-[var(--fanoos-ink)]"
      :class="{ 'text-[var(--fanoos-ink)]': activeTab === tab.id }"
      :aria-current="activeTab === tab.id ? 'page' : undefined"
      @click="emit('select', tab.id)"
    >
      <component :is="tab.icon" :size="14" />
      {{ tab.label }}
      <span
        v-if="activeTab === tab.id"
        class="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[var(--fanoos-accent)]"
      />
    </button>
  </nav>
</template>
