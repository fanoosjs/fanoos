import { describe, expect, it } from 'vitest'

import { runCli } from '../src/cli'
import fanoosModule, { analyzeJavaScript } from '../src/index'
import fanoosUi from '../src/ui'

describe('fanoos umbrella package', () => {
  it('keeps the core API available from the package root', () => {
    const result = analyzeJavaScript({
      source: 'const visible = true',
      filename: 'entry.js',
    })

    expect(result.variables).toHaveLength(1)
  })

  it('exposes the UI and CLI through dedicated subpaths', () => {
    expect(fanoosModule).toBe(fanoosUi)
    expect(typeof fanoosUi).toBe('function')
    expect(typeof runCli).toBe('function')
  })
})
