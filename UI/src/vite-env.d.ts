/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_WS_BASE_URL?: string;
  readonly VITE_AI_ASSISTANT_URL?: string;
  readonly VITE_AI_API_KEY?: string;
  readonly VITE_APP_COMMIT?: string;
  readonly VITE_APP_BUILT_AT?: string;
  readonly VITE_VERCEL_GIT_COMMIT_SHA?: string;
  readonly VITE_RENDER_GIT_COMMIT?: string;
  readonly VITE_HIDE_AUTH0?: string;
  readonly VITE_AUTH0_DOMAIN?: string;
  readonly VITE_AUTH0_CLIENT_ID?: string;
  readonly VITE_AUTH0_AUDIENCE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
