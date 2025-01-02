/**
 * Wrapper for console messages.
 *
 * @param {Mixed} message  The message to be logged.
 */
export function log(message: unknown): void {
  try {
    console.log(message);
  } catch (e) {
    //fallback
    alert(message);
  }
}
