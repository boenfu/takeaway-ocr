export function logger(error: any): void {
  // eslint-disable-next-line no-console
  console.log(`[${Date.now().toString()}]`, error);
}
