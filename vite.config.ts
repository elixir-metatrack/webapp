import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const keycloakTarget = env.LOCAL_KEYCLOAK_URL || 'https://auth.metatrack.no'
  const apiTarget = env.LOCAL_API_URL || 'https://api.metatrack.no'

  return {
    resolve: { tsconfigPaths: true },
    plugins: [
      devtools(),
      nitro({
        rollupConfig: { external: [/^@sentry\//] },
        preset: 'vercel',
        routeRules: {
          '/keycloak/**': {
            proxy: {
              to: `${keycloakTarget}/**`,
              fetchOptions: { redirect: 'manual' },
            },
          },
          '/api/**': { proxy: `${apiTarget}/api/**` },
        },
      }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ],
  }
})

export default config
