import { fileURLToPath } from 'node:url'

import { loadNuxt } from '@nuxt/kit'
import { describe, expect, it } from 'vitest'

function fixture(name: string) {
  return fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url))
}

describe('Fanoos module options', () => {
  it('throws a clear error when entry is missing', async () => {
    await expect(loadNuxt({ cwd: fixture('no-entry'), ready: true })).rejects.toThrow(
      'The "entry" module option is required',
    )
  })

  it('rejects entry files outside the extension allowlist', async () => {
    await expect(loadNuxt({ cwd: fixture('invalid-extension'), ready: true })).rejects.toThrow(
      'Only .js and .mjs entry files are allowed',
    )
  })
})
