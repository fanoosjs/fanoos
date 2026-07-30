<script setup lang="ts">
import type { AnalysisResult } from 'fanoos'
import { Layers3 } from 'lucide-vue-next'

defineProps<{
  analysis: AnalysisResult
}>()
</script>

<template>
  <div class="fanoos-scrollbar h-full overflow-y-auto p-4 sm:p-6">
    <div class="mx-auto max-w-5xl">
      <header class="mb-5 flex items-start gap-3">
        <span
          class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--fanoos-accent-soft)] text-[var(--fanoos-accent)]"
        >
          <Layers3 :size="18" />
        </span>
        <div>
          <h2 class="text-base font-semibold tracking-[-0.02em]">Structural layers</h2>
          <p class="mt-1 max-w-2xl text-xs leading-5 text-[var(--fanoos-muted)]">
            Branches split horizontally; loop bodies remain inside their repetition boundary.
          </p>
        </div>
      </header>
      <div class="space-y-4">
        <StructureNodeCard
          v-for="node in analysis.structure"
          :key="node.id"
          :node="node"
          :depth="0"
        />
      </div>
    </div>
  </div>
</template>
