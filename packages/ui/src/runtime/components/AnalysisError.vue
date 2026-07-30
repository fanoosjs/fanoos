<script setup lang="ts">
import { AlertTriangle, RefreshCw } from 'lucide-vue-next'

import { copy } from '../utils/copy'

defineProps<{
  message: string
  code?: string
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="grid min-h-[540px] place-items-center p-8">
    <section
      class="w-full max-w-lg border-l-2 border-[var(--fanoos-danger)] bg-[var(--fanoos-panel)] p-6 shadow-sm"
      role="alert"
    >
      <AlertTriangle class="mb-4 text-[var(--fanoos-danger)]" :size="24" />
      <p
        class="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--fanoos-danger)]"
      >
        {{ code || 'ANALYSIS_ERROR' }}
      </p>
      <h2 class="mt-1 text-lg font-semibold">{{ copy.states.errorTitle }}</h2>
      <p class="mt-2 text-sm leading-6 text-[var(--fanoos-muted)]">{{ message }}</p>
      <button
        type="button"
        class="mt-5 inline-flex items-center gap-2 rounded-md bg-[var(--fanoos-ink)] px-3 py-2 text-xs font-semibold text-[var(--fanoos-panel)]"
        @click="emit('retry')"
      >
        <RefreshCw :size="14" />
        Try again
      </button>
    </section>
  </div>
</template>
