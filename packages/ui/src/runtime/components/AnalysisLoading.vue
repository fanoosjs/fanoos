<script setup lang="ts">
import { Binary, GitBranch, Variable } from 'lucide-vue-next'

import { copy } from '../utils/copy'
</script>

<template>
  <div class="grid min-h-[540px] place-items-center p-8">
    <div class="w-full max-w-md text-center">
      <div class="relative mx-auto mb-6 h-20 w-56" aria-hidden="true">
        <span
          class="absolute left-0 top-6 size-7 animate-pulse rounded-md bg-[var(--fanoos-accent-soft)]"
        >
          <Variable class="m-1.5 text-[var(--fanoos-accent)]" :size="16" />
        </span>
        <span
          class="absolute left-8 right-8 top-9 h-px bg-[linear-gradient(90deg,var(--fanoos-accent),var(--fanoos-line-strong),var(--fanoos-accent))]"
        />
        <span
          class="absolute left-1/2 top-2 size-9 -translate-x-1/2 animate-pulse rounded-full border border-[var(--fanoos-accent)] bg-[var(--fanoos-panel)] [animation-delay:120ms]"
        >
          <GitBranch class="m-2 text-[var(--fanoos-accent)]" :size="18" />
        </span>
        <span
          class="absolute right-0 top-6 size-7 animate-pulse rounded-md bg-[var(--fanoos-accent-soft)] [animation-delay:240ms]"
        >
          <Binary class="m-1.5 text-[var(--fanoos-accent)]" :size="16" />
        </span>
      </div>
      <h2 class="text-lg font-semibold tracking-[-0.02em]">{{ copy.states.loadingTitle }}</h2>
      <p class="mt-2 text-sm leading-6 text-[var(--fanoos-muted)]">{{ copy.states.loadingBody }}</p>
    </div>
  </div>
</template>
