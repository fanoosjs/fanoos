<script setup lang="ts">
import { ArrowRight, Braces, GitFork, Layers3 } from 'lucide-vue-next'
import { useHead } from 'nuxt/app'

useHead({
  title: 'Fanoos · Illuminate your code.',
  meta: [
    {
      name: 'description',
      content: 'Illuminate hidden JavaScript behavior with synchronized structural views.',
    },
  ],
})
</script>

<template>
  <main
    class="grid min-h-dvh place-items-center bg-[var(--fanoos-canvas)] p-6 text-[var(--fanoos-ink)]"
  >
    <section
      class="relative w-full max-w-3xl overflow-hidden border border-[var(--fanoos-line)] bg-[var(--fanoos-panel)] p-7 shadow-sm sm:p-10"
    >
      <div class="absolute inset-y-0 left-0 w-1 bg-[var(--fanoos-accent)]" />
      <p
        class="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--fanoos-accent)]"
      >
        Fanoos · Static analysis playground
      </p>
      <h1 class="mt-5 max-w-xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
        Illuminate your code.
      </h1>
      <p class="mt-5 max-w-xl text-sm leading-7 text-[var(--fanoos-muted)]">
        Fanoos is a lantern for hidden software logic. It maps one JavaScript file into synchronized
        overview, flow, structure, and source projections—without executing a single line.
      </p>
      <div class="mt-7 flex flex-wrap gap-2">
        <span
          v-for="item in [
            { label: 'Control flow', icon: GitFork },
            { label: 'Nested structure', icon: Layers3 },
            { label: 'Linked source', icon: Braces },
          ]"
          :key="item.label"
          class="inline-flex items-center gap-2 rounded border border-[var(--fanoos-line)] bg-[var(--fanoos-panel-muted)] px-3 py-2 text-xs"
        >
          <component :is="item.icon" :size="14" class="text-[var(--fanoos-accent)]" />
          {{ item.label }}
        </span>
      </div>
      <NuxtLink
        to="/__analyse"
        class="mt-8 inline-flex items-center gap-2 rounded-md bg-[var(--fanoos-ink)] px-4 py-3 text-sm font-semibold text-[var(--fanoos-panel)] transition-transform hover:translate-x-0.5"
      >
        Open price calculation
        <ArrowRight :size="16" />
      </NuxtLink>
    </section>
  </main>
</template>
