// eslint.config.js
import defineConfig from '@antfu/eslint-config';
import vitest from '@vitest/eslint-plugin';
import nuxt from '/packages/fanoos/.nuxt/eslint.config';

export default defineConfig(
  {
    type: 'lib',

    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: true,
    },

    // TypeScript and Vue are autodetected, you can also explicitly enable them:
    typescript: true,
    pnpm: true,
    yaml: true,
    test: true,

    ignores: [
      '**/tests/**/*.vue',
    ],
  },
  {
    files: ['*.test.ts'], // or any other pattern
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.all.rules, // you can also use vitest.configs.all.rules to enable all rules
      'vitest/max-nested-describe': ['error', { max: 3 }], // you can also modify rules' behavior using option like this
      'vue/max-attributes-per-line': ['error', {
        singleline: 1,
        multiline: 1,
      }],
    },
    settings: {
      vitest: {
        typecheck: true,
      },
    },

    languageOptions: {
      globals: {
        ...vitest.environments.env.globals,
      },
    },
  },
).append(nuxt());
