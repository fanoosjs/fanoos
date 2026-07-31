import { fileURLToPath } from 'node:url'

import { AnalysisResultSchema } from '@fanoosjs/core'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

await setup({
  rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  browser: false,
  setupTimeout: 120_000,
})

describe('Fanoos Nuxt integration', () => {
  it('registers the analysis page and configured title', async () => {
    const html = await $fetch<string>('/__analyse')

    expect(html).toContain('Fixture Analysis')
    expect(html).toContain('Fixture price analysis.')
    expect(html).toContain('Generated factual summary')
  })

  it('registers an API returning schema-valid static analysis', async () => {
    const response = await $fetch<unknown>('/api/__fanoos/analyse')
    const parsed = AnalysisResultSchema.safeParse(response)

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.document.filename).toBe('fixture.js')
      expect(parsed.data.summary.loopCount).toBe(1)
      expect(parsed.data.summary.outputCount).toBe(1)
    }
  })

  it('does not accept an arbitrary entry path from the request', async () => {
    const response = await $fetch<{
      document: { filename: string }
    }>('/api/__fanoos/analyse?entry=../../package.json')
    const postResponse = await fetch('/api/__fanoos/analyse', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ entry: '../../package.json' }),
    })

    expect(response.document.filename).toBe('fixture.js')
    expect(postResponse.status).toBeGreaterThanOrEqual(400)
  })

  it('renders the analysis route without internal stack traces', async () => {
    const response = await fetch('/__analyse')

    expect(response.status).toBe(200)
    expect(await response.text()).not.toContain('Failed to resolve component')
  })
})
