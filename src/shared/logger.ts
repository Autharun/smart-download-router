export function logDebug(message: string, ...details: unknown[]): void {
  if (import.meta.env.DEV) {
    console.debug(`[Smart Download Router] ${message}`, ...details);
  }
}
