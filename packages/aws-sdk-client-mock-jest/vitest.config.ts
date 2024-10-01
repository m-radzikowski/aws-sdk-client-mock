import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.vitest.ts'],
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['src/vitest.ts'],
      thresholds: {
        100: true
      }
    },
    snapshotSerializers: ['./vitest.serializer.ts'],
  }
})
