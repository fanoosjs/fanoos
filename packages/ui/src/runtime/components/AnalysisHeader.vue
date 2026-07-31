<script setup lang="ts">
import { CheckCircle2, Moon, PanelLeftOpen, PanelRightOpen, RefreshCw, Sun } from '@lucide/vue'

import { copy } from '../utils/copy'

defineProps<{
  title: string
  filename: string
  status: 'idle' | 'pending' | 'success' | 'error'
  theme: 'light' | 'dark'
}>()

const emit = defineEmits<{
  refresh: []
  toggleTheme: []
  openNavigator: []
  openInspector: []
}>()
</script>

<template>
  <header
    class="flex min-h-16 items-center gap-3 border-b border-[var(--fanoos-line)] bg-[var(--fanoos-panel)] px-4 lg:px-5"
  >
    <button
      type="button"
      class="rounded-md p-2 text-[var(--fanoos-muted)] hover:bg-[var(--fanoos-panel-muted)] lg:hidden"
      :aria-label="copy.actions.openNavigator"
      @click="emit('openNavigator')"
    >
      <PanelLeftOpen :size="18" />
    </button>

    <svg class="size-9 shrink-0" viewBox="0 0 36 36" role="img" aria-label="Fanoos lantern mark">
      <rect width="36" height="36" rx="9" fill="var(--fanoos-ink)" />
      <path
        d="M13 11.5C13.4 7.8 15.2 6 18 6s4.6 1.8 5 5.5M11 12h14M12.4 15h11.2l-1.4 14h-8.4z"
        fill="none"
        stroke="var(--fanoos-accent)"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M15.5 24.5 18 21l2.5 2 2-4"
        fill="none"
        stroke="var(--fanoos-panel)"
        stroke-width="1.25"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle cx="15.5" cy="24.5" r="1.15" fill="var(--fanoos-accent)" />
      <circle cx="18" cy="21" r="1.15" fill="var(--fanoos-accent)" />
      <circle cx="20.5" cy="23" r="1.15" fill="var(--fanoos-accent)" />
      <circle cx="22.5" cy="19" r="1.15" fill="var(--fanoos-accent)" />
    </svg>
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <h1 class="truncate text-sm font-semibold tracking-[-0.01em]">{{ title }}</h1>
        <span
          v-if="status === 'success'"
          class="inline-flex items-center gap-1 rounded-full bg-[var(--fanoos-accent-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--fanoos-accent)]"
        >
          <CheckCircle2 :size="11" />
          Analysed
        </span>
      </div>
      <p class="truncate font-mono text-[11px] text-[var(--fanoos-muted)]">
        {{ copy.tagline }} · {{ filename }}
      </p>
    </div>

    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-md border border-[var(--fanoos-line)] bg-[var(--fanoos-panel)] px-3 py-2 text-xs font-semibold hover:border-[var(--fanoos-line-strong)] hover:bg-[var(--fanoos-panel-muted)] disabled:cursor-wait disabled:opacity-60"
      :disabled="status === 'pending'"
      @click="emit('refresh')"
    >
      <RefreshCw :size="14" :class="{ 'animate-spin': status === 'pending' }" />
      <span class="hidden sm:inline">Refresh</span>
    </button>
    <button
      type="button"
      class="rounded-md border border-[var(--fanoos-line)] p-2 text-[var(--fanoos-muted)] hover:border-[var(--fanoos-line-strong)] hover:bg-[var(--fanoos-panel-muted)]"
      :aria-label="copy.actions.toggleTheme"
      @click="emit('toggleTheme')"
    >
      <Sun v-if="theme === 'dark'" :size="16" />
      <Moon v-else :size="16" />
    </button>
    <button
      type="button"
      class="rounded-md p-2 text-[var(--fanoos-muted)] hover:bg-[var(--fanoos-panel-muted)] lg:hidden"
      :aria-label="copy.actions.openInspector"
      @click="emit('openInspector')"
    >
      <PanelRightOpen :size="18" />
    </button>
  </header>
</template>
