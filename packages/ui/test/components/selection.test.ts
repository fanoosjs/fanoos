// @vitest-environment happy-dom

import { analyzeJavaScript, type AnalysisResult } from 'fanoos'
import { mount } from '@vue/test-utils'
import { shallowRef } from 'vue'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import DiagnosticsPanel from '../../src/runtime/components/DiagnosticsPanel.vue'
import SourceView from '../../src/runtime/components/SourceView.vue'
import StructureNodeCard from '../../src/runtime/components/StructureNodeCard.vue'
import {
  analysisSelectionKey,
  createAnalysisSelection,
} from '../../src/runtime/composables/useAnalysisSelection'

function fixture(source: string): AnalysisResult {
  return analyzeJavaScript({ source, filename: 'component.js' })
}

function selectionFor(analysis: AnalysisResult) {
  return createAnalysisSelection(shallowRef<AnalysisResult | null>(analysis))
}

function tokensFor(source: string) {
  const lines = source.split('\n').map((line) => [{ content: line }])
  return { light: lines, dark: lines }
}

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

describe('synchronized analysis components', () => {
  it('selects a structure node when its card is clicked', async () => {
    const analysis = fixture('let total = 0')
    const selection = selectionFor(analysis)
    const wrapper = mount(StructureNodeCard, {
      props: { node: analysis.structure[0]! },
      global: {
        provide: { [analysisSelectionKey as symbol]: selection },
      },
    })

    await wrapper.get('button').trigger('click')

    expect(selection.selectedNodeId.value).toBe(analysis.structure[0]?.id)
  })

  it('selects the smallest matching node when a source line is clicked', async () => {
    const source = 'let total = 0\ntotal++'
    const analysis = fixture(source)
    const selection = selectionFor(analysis)
    const wrapper = mount(SourceView, {
      props: {
        analysis,
        tokens: tokensFor(source),
        theme: 'light',
      },
      global: {
        provide: { [analysisSelectionKey as symbol]: selection },
      },
    })

    await wrapper.get('#fanoos-source-line-2').trigger('click')

    expect(selection.selectedNode.value?.kind).toBe('update')
  })

  it('marks variable declaration, read, and write lines', () => {
    const source = 'let total = 0\nlet price = 1\ntotal = total + price'
    const analysis = fixture(source)
    const selection = selectionFor(analysis)
    selection.selectVariable('total')
    const wrapper = mount(SourceView, {
      props: {
        analysis,
        tokens: tokensFor(source),
        theme: 'light',
      },
      global: {
        provide: { [analysisSelectionKey as symbol]: selection },
      },
    })

    expect(wrapper.get('#fanoos-source-line-1').classes()).toContain(
      'border-l-[var(--fanoos-accent)]',
    )
    expect(wrapper.get('#fanoos-source-line-3').classes()).toContain('border-l-[#6f8fd5]')
    expect(wrapper.get('#fanoos-source-line-3').classes()).toContain(
      'border-l-[var(--fanoos-warning)]',
    )
  })

  it('renders diagnostic severity as a stable data attribute', () => {
    const analysis = fixture('function unsupported() {}')
    const wrapper = mount(DiagnosticsPanel, {
      props: { diagnostics: analysis.diagnostics },
    })

    expect(wrapper.get('[data-severity="warning"]').text()).toContain('UNSUPPORTED_STATEMENT')
  })

  it('shows No operation for an empty branch', () => {
    const analysis = fixture('let ready = true\nif (ready) {}')
    const selection = selectionFor(analysis)
    const condition = analysis.structure.find((node) => node.kind === 'if')
    const wrapper = mount(StructureNodeCard, {
      props: { node: condition! },
      global: {
        provide: { [analysisSelectionKey as symbol]: selection },
      },
    })

    expect(wrapper.text()).toContain('No operation')
  })
})
