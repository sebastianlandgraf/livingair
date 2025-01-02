/**
 * Wrapper for console messages.
 *
 * @param {Mixed} message  The message to be logged.
 */
export function log(message) {
    try {
        console.log(message);
    }
    catch (e) {
        //fallback
        alert(message);
    }
}
