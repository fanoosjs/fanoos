import { existsSync } from 'node:fs'
import { extname, resolve as resolvePath } from 'node:path'

import {
  addComponentsDir,
  addServerHandler,
  addVitePlugin,
  createResolver,
  defineNuxtModule,
  extendPages,
} from '@nuxt/kit'
import tailwindcss from '@tailwindcss/vite'

export interface FanoosModuleOptions {
  entry: string
  route?: string
  apiRoute?: string
  title?: string
  enabled?: boolean
}

const ALLOWED_EXTENSIONS = new Set(['.js', '.mjs'])

export default defineNuxtModule<FanoosModuleOptions>({
  meta: {
    name: '@fanoosjs/ui',
    configKey: 'fanoos',
    compatibility: {
      nuxt: '^4.0.0',
    },
  },
  defaults: {
    entry: '',
    route: '/__analyse',
    apiRoute: '/api/__fanoos/analyse',
    title: 'Fanoos',
    enabled: true,
  },
  setup(options, nuxt) {
    if (!options.enabled) {
      return
    }
    if (!options.entry.trim()) {
      throw new Error('[Fanoos] The "entry" module option is required.')
    }

    const entry = resolvePath(nuxt.options.rootDir, options.entry)
    const extension = extname(entry).toLowerCase()
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      throw new Error('[Fanoos] Only .js and .mjs entry files are allowed.')
    }

    const resolver = createResolver(import.meta.url)
    const route = options.route || '/__analyse'
    const apiRoute = options.apiRoute || '/api/__fanoos/analyse'
    const title = options.title || 'Fanoos'

    nuxt.options.runtimeConfig.fanoos = {
      entry,
      entryExistsAtBuild: existsSync(entry),
    }
    nuxt.options.runtimeConfig.public.fanoos = {
      route,
      apiRoute,
      title,
    }

    extendPages((pages) => {
      pages.push({
        name: 'fanoos-analysis',
        path: route,
        file: resolver.resolve('./runtime/pages/analyse.vue'),
      })
    })

    addServerHandler({
      route: apiRoute,
      method: 'get',
      handler: resolver.resolve('./runtime/server/analyse.get'),
    })

    addComponentsDir({
      path: resolver.resolve('./runtime/components'),
      pathPrefix: false,
    })

    addVitePlugin(tailwindcss())
    nuxt.options.css.push(
      resolver.resolve('./runtime/assets/main.css'),
      '@vue-flow/core/dist/style.css',
      '@vue-flow/core/dist/theme-default.css',
      '@vue-flow/controls/dist/style.css',
      '@vue-flow/minimap/dist/style.css',
    )
  },
})

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    fanoos: {
      entry: string
      entryExistsAtBuild: boolean
    }
  }

  interface PublicRuntimeConfig {
    fanoos: {
      route: string
      apiRoute: string
      title: string
    }
  }
}
