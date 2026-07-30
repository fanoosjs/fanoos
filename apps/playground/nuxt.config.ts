export default defineNuxtConfig({
  compatibilityDate: '2026-07-30',
  devtools: { enabled: true },
  modules: [
    [
      '@fanoosjs/ui',
      {
        entry: './examples/price-calculation.js',
        route: '/__analyse',
        title: 'Fanoos Playground',
      },
    ],
  ],
})
