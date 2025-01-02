/**
 * Get type and format and return it in an array. Create an
 * item.type entry if it doesn't exist.
 *
 * @param {Object} item     An item of a variable list.
 * @return {Array} arr      An array with type and format.
 */
export declare function getTypeAndFormat(item: {
    type: string;
}): string[];
/**
 * Decode variable names passed as strings and return the object,
 * store data values if they are passed too.
 *
 * @param {String} name     The name of a JavaScript variable or a property.
 * @param {Object} data     Data values to store in the variable/property.
 * @param {Object} obj      The object containing the property to store the data in.
 *                          Used with createArrayDescriptor and createStructDescriptor
 *                          for better performance.
 */
export declare function parseVarName(name: unknown, data?: string, obj?: Window & typeof globalThis, prefix?: string, suffix?: string): any;
/**
 * Check if a passed string length is valid.
 *
 * @param {Number} len
 */
export declare function isValidStringLen(len: number): boolean;
/**
 * Convert a value to value in milliseconds, depending
 * on the format string.
 *
 * @param {Number} time
 * @param {String} format
 */
export declare function toMillisec(time: number, format: string): number;
/**
 * Convert a number into an array of bytes.
 *
 * @param {Number} value
 * @param {Number} varlen
 */
export declare function numToByteArr(value: number, varlen: number): number[];
/**
 * Convert a number to a hex string.
 *
 * @param {Number} value
 */
export declare function numToHexString(value: number): string;
/**
 * Set a fixed length of an integer by adding leading
 * zeros(i.e. change 2 to 02).
 *
 * @param {Number} numb
 * @param {Number} places
 */
export declare function fixNumbLength(numb: number, places: number): string;
/**
 * Conversion of ASCII(0-9, a-f, A-F) charcodes to numbers 0-15
 *
 * @param {Number} charcode
 */
export declare function charcodeToDual(charcode: number): number;
/**
 * Convert a JavaScript floating point number to a PLC REAL value.
 *
 * @param {Number} num
 */
export declare function floatToReal(num: number): number;
/**
 * Convert a JavaScript floating point number to a PLC LREAL value.
 * Cause it's a 64 bit value, we have to split it in two 32 bit integer.
 *
 * @param {Number} num
 */
export declare function floatToLreal(num: number): {
    part1: number;
    part2: number;
};
/**
 * Convert a TOD string to a value of milliseconds.
 *
 * @param {Number} time
 * @param {String} format
 */
export declare function stringToTime(timestring: string, format: string): number;
/**
 * Function for converting the data values to a byte array.
 *
 * @param {Object} item     An item of the item list of a request descriptor.
 * @param {String} type     Contains the data type
 * @param {String} format   The formatting string.
 * @param {Number} len      Data length.
 * @return {Array} bytes    An array containing the data as byte values.
 */
export declare function dataToByteArray(item: {
    val?: number | Date | string;
}, type: string, format: string, len: number): any[];
