/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_CHANNEL_ID: string;
  readonly VITE_API_BASE: string;
  readonly VITE_GA_MEASUREMENT_ID: string;
  readonly VITE_ENABLE_SETTINGS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  queryClient?: import("@tanstack/react-query").QueryClient;
}
