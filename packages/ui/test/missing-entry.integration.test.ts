import { fileURLToPath } from 'node:url'

import { fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

await setup({
  rootDir: fileURLToPath(new URL('./fixtures/missing', import.meta.url)),
  browser: false,
  setupTimeout: 120_000,
})

describe('missing entry response', () => {
  it('returns a controlled not-found error', async () => {
    const response = await fetch('/api/__fanoos/analyse')
    const body = await response.text()

    expect(response.status).toBe(404)
    expect(body).toContain('ENTRY_FILE_NOT_FOUND')
    expect(body).not.toContain('/Users/')
  })
})
