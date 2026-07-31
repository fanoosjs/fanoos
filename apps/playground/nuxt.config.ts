export default defineNuxtConfig({
  compatibilityDate: '2026-07-30',
  devtools: { enabled: true },
  modules: [
    [
      'fanoos',
      {
        entry: './examples/nested-condition.js',
        route: '/__analyse',
        title: 'Fanoos Playground',
      },
    ],
  ],
})
