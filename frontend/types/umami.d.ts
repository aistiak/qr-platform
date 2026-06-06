export {};

declare global {
  interface Window {
    umami?: {
      identify: (
        id: string | Record<string, string>,
        data?: Record<string, string>,
      ) => void;
    };
  }
}
