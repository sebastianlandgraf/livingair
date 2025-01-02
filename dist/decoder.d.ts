/**
 * Convert B64-substrings to data.
 *
 * @param {String} dataString
 * @param {String} type
 * @param {String, Number} format
 * @return {Mixed} data
 *
 */
export declare function subStringToData(dataString: string, type: string, format?: string): string | number | boolean | Date | undefined;
/**
 * Convert data string of a LREAL variable
 * to a JavaScript floating point number.
 *
 * @param {String} string
 */
export declare function parsePlcLreal(string: string): number;
/**
 * Convert data string to string by simply cutting of superfluous characters.
 *
 * @param {String} string
 */
export declare function parsePlcString(string: string): string;
/**
 * Convert data string of a REAL variable
 * to a JavaScript floating point number.
 *
 * @param {String} string
 */
export declare function parsePlcReal(string: string): number;
/**
 * Convert data string to a formatted date/time of day string.
 *
 * @param {String} string
 * @param {String} format
 */
export declare function parsePlcDate(string: string, format?: string): string | Date;
/**
 * Convert data string to a formatted time of day string.
 *
 * @param {String} string
 * @param {String} format
 */
export declare function parsePlcTod(string: string, format?: string): string | Date;
/**
 * Convert a date object to a formatted string.
 *
 * @param {Date} time
 * @param {String} format
 */
export declare function dateToString(time: Date, format: string): string;
/**
 * Convert a number with a value in milliseconds to a formatted string.
 *
 * @param {Number} time
 * @param {String} format
 */
export declare function timeToString(time: number, format: string): string;
/**
 * Convert data string to USINT/BYTE.
 *
 * @param {String} string
 */
export declare function parsePlcUsint(string: string): number;
/**
 * Convert data string to SINT.
 *
 * @param {String} string
 */
export declare function parsePlcSint(string: string): number;
/**
 * Convert data string to UINT/WORD.
 *
 * @param {String} string
 */
export declare function parsePlcUint(string: string): number;
/**
 * Convert data string to INT.
 *
 * @param {String} string
 */
export declare function parsePlcInt(string: string): number;
/**
 * Convert data string to DINT.
 *
 * @param {String} string
 */
export declare function parsePlcDint(string: string): number;
/**
 * Convert data string to a formatted time string
 *
 * @param {String} string
 * @param {String} format
 */
export declare function parsePlcTime(string: string, format?: string): string | number;
