/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_RAZORPAY_KEY_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// The lightweight hls.js build ships no types for its subpath export; reuse the
// main build's types (the API is a subset, same default export).
declare module 'hls.js/light' {
  export { default } from 'hls.js';
}
