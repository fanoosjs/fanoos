import fanoos from '../../../src/module'

export default defineNuxtConfig({
  compatibilityDate: '2026-07-30',
  modules: [[fanoos, { entry: './does-not-exist.js' }]],
})
