/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GAS_API_URL: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_SPREADSHEET_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
