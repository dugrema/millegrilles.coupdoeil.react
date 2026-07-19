import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isBuild = command === 'build'

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@apiMapping-json': isBuild
          ? path.resolve(__dirname, 'src/workers/apiMapping.signed.json')
          : path.resolve(__dirname, 'src/workers/apiMapping.json'),
        '@manifest-build-json': isBuild
          ? path.resolve(__dirname, 'build_assets/manifest.build.json')
          : path.resolve(__dirname, 'src/manifest.build.json'),
      },
    },
    base: '/coupdoeil2/',
  }
})
