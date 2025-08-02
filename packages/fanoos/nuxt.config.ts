// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['reka-ui/nuxt', '@nuxt/ui-pro', '@nuxt/icon', '@nuxt/content', 'nuxt-typed-router', 'motion-v/nuxt'],

  icon: {
    aliases: {
      ts: 'vscode-icons:file-type-typescript',
      js: 'vscode-icons:file-type-js',
    },
  },

  content: {
    experimental: { sqliteConnector: 'native' },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  css: ['~/assets/css/main.css'],

  experimental: {
    typedPages: true,
  },
});
