<script setup lang="ts">
import type { AnalysisResult } from 'fanoos'
import { useFetch, useHead, useRuntimeConfig } from 'nuxt/app'
import { computed, onMounted, shallowRef } from 'vue'

import {
  createAnalysisSelection,
  provideAnalysisSelection,
} from '../composables/useAnalysisSelection'
import type { AnalysisApiError, AnalysisPayload, SourceTokenSet } from '../types'
import type { AnalysisTab } from './AnalysisTabs.vue'

const config = useRuntimeConfig()
const activeTab = shallowRef<AnalysisTab>('overview')
const theme = shallowRef<'light' | 'dark'>('light')
const navigatorOpen = shallowRef(false)
const inspectorOpen = shallowRef(false)

const { data, error, status, refresh } = await useFetch<AnalysisPayload>(
  config.public.fanoos.apiRoute,
  {
    key: `fanoos:${config.public.fanoos.apiRoute}`,
  },
)

function errorPayload(value: unknown): AnalysisApiError['data'] | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }
  const candidate = value as {
    data?: AnalysisApiError['data'] | { data?: AnalysisApiError['data'] }
  }
  if (candidate.data && 'data' in candidate.data) {
    return candidate.data.data
  }
  return candidate.data as AnalysisApiError['data'] | undefined
}

const failure = computed(() => errorPayload(error.value))
const analysis = computed<AnalysisResult | null>(
  () => data.value ?? failure.value?.analysis ?? null,
)
const fallbackTokens = computed<SourceTokenSet>(() => {
  const source = analysis.value?.document.source ?? ''
  const lines = source.split('\n').map((line) => [{ content: line }])
  return { light: lines, dark: lines }
})
const tokens = computed(() => data.value?.sourceTokens ?? fallbackTokens.value)
const selection = createAnalysisSelection(analysis)
provideAnalysisSelection(selection)

useHead({
  title: computed(
    () => `${analysis.value?.document.filename ?? 'Analysis'} · ${config.public.fanoos.title}`,
  ),
})

function applyTheme(nextTheme: 'light' | 'dark') {
  theme.value = nextTheme
  document.documentElement.classList.toggle('dark', nextTheme === 'dark')
  localStorage.setItem('fanoos-theme', nextTheme)
}

function toggleTheme() {
  applyTheme(theme.value === 'light' ? 'dark' : 'light')
}

async function refreshAnalysis() {
  await refresh()
}

onMounted(() => {
  const saved = localStorage.getItem('fanoos-theme')
  const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  applyTheme(saved === 'dark' || saved === 'light' ? saved : preferred)
})
</script>

<template>
  <div
    class="h-dvh min-h-[620px] overflow-hidden bg-[var(--fanoos-canvas)] text-[var(--fanoos-ink)]"
  >
    <div class="grid h-full grid-rows-[64px_44px_minmax(0,1fr)]">
      <AnalysisHeader
        :title="config.public.fanoos.title"
        :filename="analysis?.document.filename || 'Configured entry'"
        :status="status"
        :theme="theme"
        @refresh="refreshAnalysis"
        @toggle-theme="toggleTheme"
        @open-navigator="navigatorOpen = true"
        @open-inspector="inspectorOpen = true"
      />
      <AnalysisTabs :active-tab="activeTab" @select="activeTab = $event" />

      <AnalysisLoading v-if="status === 'pending' && !analysis" />
      <AnalysisError
        v-else-if="error && !analysis"
        :message="failure?.message || 'The configured source could not be loaded.'"
        :code="failure?.code"
        @retry="refreshAnalysis"
      />
      <div v-else-if="analysis" class="grid min-h-0 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div class="hidden min-h-0 lg:block">
          <AnalysisNavigator :analysis="analysis" />
        </div>
        <main class="grid min-h-0 grid-rows-[minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)_190px]">
          <section class="min-h-0 overflow-hidden" :aria-label="`${activeTab} view`">
            <OverviewView
              v-if="activeTab === 'overview'"
              :analysis="analysis"
              @open-source="activeTab = 'source'"
            />
            <FlowView v-else-if="activeTab === 'flow'" :analysis="analysis" />
            <StructureView v-else-if="activeTab === 'structure'" :analysis="analysis" />
            <SourceView v-else :analysis="analysis" :tokens="tokens" :theme="theme" />
          </section>
          <div class="hidden min-h-0 lg:block">
            <AnalysisInspector :analysis="analysis" />
          </div>
        </main>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="navigatorOpen && analysis" class="fixed inset-0 z-50 lg:hidden">
        <button
          type="button"
          class="absolute inset-0 bg-black/45"
          aria-label="Close navigator"
          @click="navigatorOpen = false"
        />
        <div class="absolute inset-y-0 left-0">
          <AnalysisNavigator
            :analysis="analysis"
            drawer
            @close="navigatorOpen = false"
            @navigate="navigatorOpen = false"
          />
        </div>
      </div>
      <div v-if="inspectorOpen && analysis" class="fixed inset-0 z-50 lg:hidden">
        <button
          type="button"
          class="absolute inset-0 bg-black/45"
          aria-label="Close inspector"
          @click="inspectorOpen = false"
        />
        <div class="absolute inset-y-0 right-0">
          <AnalysisInspector :analysis="analysis" drawer @close="inspectorOpen = false" />
        </div>
      </div>
    </Teleport>
  </div>
</template>
