export {}

/** Minimal shape; extend when you integrate the Telegram Web App API. */
declare global {
  interface Window {
    Telegram?: {
      WebApp: Record<string, unknown>
    }
  }
}
