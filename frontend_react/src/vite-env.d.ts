/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;
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
