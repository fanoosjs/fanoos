// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['reka-ui/nuxt', '@nuxt/icon'],

  icon: {
    aliases: {
      'folder': 'material-symbols:folder',
      'folder-open': 'material-symbols:folder-open',
      'ts': 'material-icon-theme:typescript',
      'js': 'material-icon-theme:javascript',
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  css: ['~/assets/css/main.css'],

  experimental: {
    typedPages: true,
  },
});
