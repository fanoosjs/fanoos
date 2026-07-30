<script setup lang="ts">
import type { Diagnostic } from 'fanoos'
import { AlertCircle, AlertTriangle, Info } from 'lucide-vue-next'

import { copy } from '../utils/copy'

defineProps<{
  diagnostics: Diagnostic[]
  compact?: boolean
}>()

const emit = defineEmits<{
  select: [diagnostic: Diagnostic]
}>()

function severityClasses(severity: Diagnostic['severity']) {
  if (severity === 'error') {
    return 'border-[var(--fanoos-danger)] text-[var(--fanoos-danger)]'
  }
  if (severity === 'warning') {
    return 'border-[var(--fanoos-warning)] text-[var(--fanoos-warning)]'
  }
  return 'border-[var(--fanoos-accent)] text-[var(--fanoos-accent)]'
}
</script>

<template>
  <div v-if="diagnostics.length" class="space-y-2">
    <button
      v-for="diagnostic in diagnostics"
      :key="diagnostic.id"
      type="button"
      class="flex w-full items-start gap-2 border-l-2 bg-[var(--fanoos-panel-muted)] p-2.5 text-left transition-colors hover:bg-[var(--fanoos-accent-soft)]"
      :class="severityClasses(diagnostic.severity)"
      :data-severity="diagnostic.severity"
      @click="emit('select', diagnostic)"
    >
      <AlertCircle v-if="diagnostic.severity === 'error'" class="mt-0.5 shrink-0" :size="14" />
      <AlertTriangle
        v-else-if="diagnostic.severity === 'warning'"
        class="mt-0.5 shrink-0"
        :size="14"
      />
      <Info v-else class="mt-0.5 shrink-0" :size="14" />
      <span class="min-w-0">
        <span class="block font-mono text-[9px] font-bold tracking-[0.06em]">
          {{ diagnostic.code }}
        </span>
        <span v-if="!compact" class="mt-0.5 block text-xs leading-5 text-[var(--fanoos-ink)]">
          {{ diagnostic.message }}
        </span>
        <span v-if="diagnostic.location" class="block text-[10px] text-[var(--fanoos-muted)]">
          Line {{ diagnostic.location.startLine }}
        </span>
      </span>
    </button>
  </div>
  <p v-else class="py-3 text-xs text-[var(--fanoos-muted)]">{{ copy.states.noDiagnostics }}</p>
</template>
