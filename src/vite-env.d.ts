/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_SOURCE?: 'mock' | 'api'
  readonly VITE_API_BASE_URL?: string
  readonly VITE_SYNTH_SEED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
