import { log } from './log.js';
import { plcTypeLen } from './plc.js';

const useCheckBounds: boolean = true;
const maxStringLen: number = 255;

/**
 * Get type and format and return it in an array. Create an
 * item.type entry if it doesn't exist.
 *
 * @param {Object} item     An item of a variable list.
 * @return {Array} arr      An array with type and format.
 */
export function getTypeAndFormat(item: { type: string }): string[] {
  let arr: string[] = [];

  if (typeof item.type === 'string') {
    //Type is defined
    arr = item.type.split('.');
    if (arr.length > 2) {
      //Join the formatting string if there were points in it.
      arr[1] = arr.slice(1).join('.');
    }
  } else {
    log('TAME library error: Could not get the type of the item!');
    log(item);
  }
  return arr;
}

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
export function parseVarName(
  name: unknown,
  data?: string,
  obj?: Window & typeof globalThis,
  prefix?: string,
  suffix?: string,
) {
  let arr: string[] = [];
  let last = 0;
  let i = 0;

  if (typeof name === 'number') {
    arr[0] = name.toString(10);
  } else if (typeof name === 'string') {
    arr = name.split('.');
  } else {
    log(
      "TAME library error: Can't parse name of object/variable. Name is not a string or number!",
    );
    log(name);
    return;
  }

  if (obj === undefined) {
    obj = window;
  }
  last = arr.length - 1;

  //Walk through the tiers
  while (i < last) {
    //Check if the passed name points to an array.
    if (arr[i].charAt(arr[i].length - 1) === ']') {
      const a = arr[i].substring(0, arr[i].length - 1).split('[');
      obj = obj![a[0]][a[1]];
    } else {
      //Create an array if object is not defined.
      //This can happen when an array of structure is
      //not defined.
      if (obj![arr[i]] === undefined) {
        obj![arr[i]] = [];
      }
      obj = obj![arr[i]];
    }
    i++;
  }

  //Last element
  if (arr[i].charAt(arr[i].length - 1) === ']') {
    //If last item of the name is an array
    const a = arr[i].substring(0, arr[i].length - 1).split('[');
    obj = obj![a[0]];

    //Store data if passed.
    if (data !== undefined) {
      if (typeof prefix === 'string') {
        data = prefix + data;
      }
      if (typeof suffix === 'string') {
        data = data + suffix;
      }
      obj![a[1]] = data;
    }
    return obj![a[1]];
  }

  //Store data if passed.
  if (data !== undefined) {
    if (typeof prefix === 'string') {
      data = prefix + data;
    }
    if (typeof suffix === 'string') {
      data = data + suffix;
    }
    obj![arr[i]] = data;
  }
  return obj![arr[i]];
}

/**
 * Check if a passed string length is valid.
 *
 * @param {Number} len
 */
export function isValidStringLen(len: number) {
  if (len === undefined) {
    return false;
  }
  if (!isNaN(len) && len > 0 && len <= maxStringLen) {
    return true;
  }
  log(
    'TAME library error: User defined string length not valid! length: ' + len,
  );
  log('Max. string length: ' + maxStringLen);
  return false;
}

/**
 * Function for checking the input values when writing numeric PLC variables.
 *
 * @param {Object} item
 * @param {String} type
 * @param {Number} min
 * @param {Number} max
 */
function checkValue(
  item: { val?: number | Date | string },
  type: string,
  min?: number,
  max?: number,
) {
  let val;

  //Test if value is valid.
  if (typeof item.val === 'string') {
    if (type === 'REAL' || type === 'LREAL') {
      val = parseFloat(item.val);
    } else {
      val = parseInt(item.val, 10);
    }
  } else if (typeof item.val === 'number') {
    val = item.val;
  } else {
    log(
      'TAME library error: Wrong variable type for a numeric variable in write request!',
    );
    log(
      'TAME library error: Variable type should be number or string, but is ' +
        typeof item.val,
    );
    log(item);
    val = 0;
  }

  if (isNaN(val)) {
    val = 0;
    log(
      'TAME library error: Value of a numeric variable in write request is not a number.',
    );
    log(item);
  }

  //Check bounds
  if (useCheckBounds === true) {
    if (type === 'LREAL') {
      if (!isFinite(val)) {
        log('TAME library warning: Limit for LREAL value exceeded!');
        log('Upper limit: ' + Number.MAX_VALUE);
        log('Lower limit: ' + Number.MIN_VALUE);
        log('value: ' + val);
        log(item);
      }
    } else if (type === 'REAL') {
      if (val > 0) {
        if (val < 1.175495e-38) {
          log(
            'TAME library warning: Lower limit for positive REAL value exceeded!',
          );
          log('limit: 1.175495e-38');
          log('value: ' + val);
          log(item);
          val = 1.175495e-38;
        } else if (val > 3.402823e38) {
          log(
            'TAME library warning: Upper limit for positive REAL value exceeded!',
          );
          log('limit: 3.402823e+38');
          log('value: ' + val);
          log(item);
          val = 3.402823e38;
        }
      } else if (val < 0) {
        if (val > -1.175495e-38) {
          log(
            'TAME library warning: Upper limit for negative REAL value exceeded!',
          );
          log('limit: -1.175495e-38');
          log('value: ' + val);
          log(item);
          val = -1.175495e-38;
        } else if (val < -3.402823e38) {
          log(
            'TAME library warning: Lower limit for negative REAL value exceeded!',
          );
          log('limit: -3.402823e+38');
          log('value: ' + val);
          log(item);
          val = -3.402823e38;
        }
      }
    } else {
      if (min && val < min) {
        log('TAME library warning: Lower limit for numeric value exceeded!');
        log('type: ' + type);
        log('limit: ' + min);
        log('value: ' + val);
        log(item);
        val = min;
      } else if (max && val > max) {
        log('TAME library warning: Upper limit for numeric value exceeded!');
        log('type: ' + type);
        log('limit: ' + max);
        log('value: ' + val);
        log(item);
        val = max;
      }
    }
  }

  return val;
}

/**
 * Convert a value to value in milliseconds, depending
 * on the format string.
 *
 * @param {Number} time
 * @param {String} format
 */
export function toMillisec(time: number, format: string) {
  let tmp;
  switch (format) {
    case '#d':
    case '#dd':
      tmp = time * 86400000; //days
      break;
    case '#h':
    case '#hh':
      tmp = time * 3600000; //hours
      break;
    case '#m':
    case '#mm':
      tmp = time * 60000; //minutes
      break;
    case '#s':
    case '#ss':
      tmp = time * 1000; //seconds
      break;
    case '#ms':
    case '#msmsms': //milliseconds
      tmp = time;
      break;
    default:
      tmp = time;
      break;
  }
  return tmp;
}

/**
 * Convert a number into an array of bytes.
 *
 * @param {Number} value
 * @param {Number} varlen
 */
export function numToByteArr(value: number, varlen: number) {
  const bytes = [];
  let hex = value.toString(16);

  while (hex.length < varlen * 2) {
    hex = '0' + hex;
  }

  for (let i = 0; i < varlen; i++) {
    bytes[varlen - 1 - i] =
      charcodeToDual(hex.charCodeAt(i * 2)) * 16 +
      charcodeToDual(hex.charCodeAt(i * 2 + 1));
  }
  return bytes;
}

/**
 * Convert a number to a hex string.
 *
 * @param {Number} value
 */
export function numToHexString(value: number) {
  let ret = value.toString(16);
  if (ret.length % 2 !== 0) {
    ret = '0' + ret;
  }
  return ret;
}

/**
 * Set a fixed length of an integer by adding leading
 * zeros(i.e. change 2 to 02).
 *
 * @param {Number} numb
 * @param {Number} places
 */
export function fixNumbLength(numb: number, places: number) {
  places = isNaN(places) ? 0 : places;
  let str = numb.toString(10);
  while (str.length < places) {
    str = '0' + str;
  }
  return str;
}

/**
 * Conversion of ASCII(0-9, a-f, A-F) charcodes to numbers 0-15
 *
 * @param {Number} charcode
 */
export function charcodeToDual(charcode: number) {
  if (charcode >= 0x61 && charcode <= 0x66) {
    return charcode - 0x57; //a-f
  }
  if (charcode >= 0x41 && charcode <= 0x46) {
    return charcode - 0x37; //A-F
  }
  if (charcode >= 0x30 && charcode <= 0x39) {
    return charcode - 0x30; //0-9
  }
  return 0;
}

/**
 * Convert a JavaScript floating point number to a PLC REAL value.
 *
 * @param {Number} num
 */
export function floatToReal(num: number) {
  let mant = 0,
    real = 0,
    bas = 0,
    bas2,
    tmp,
    exp = 0;

  const abs = Math.abs(num);

  if (num !== 0) {
    //Find exponent and base.
    for (let i = 128; i > -127; i--) {
      tmp = abs / Math.pow(2, i);
      if (tmp >= 2) {
        break;
      }
      exp = i;
      bas = tmp;
    }
    exp += 127;
    bas2 = bas.toString(2);
    //Create the mantissa.
    for (let i = 2; i < 25; i++) {
      mant <<= 1;
      if (bas2.charAt(i) === '1') {
        mant += 1;
      }
    }
    if (bas2.charAt(25) === '1') {
      mant += 1;
    }
    //Create the REAL value.
    real = exp; //exponent
    real <<= 23;
    real += mant; //mantissa
    if (num < 0) {
      //Create negative sign.
      real += 2147483648;
    }
  }
  return real;
}

/**
 * Convert a JavaScript floating point number to a PLC LREAL value.
 * Cause it's a 64 bit value, we have to split it in two 32 bit integer.
 *
 * @param {Number} num
 */
export function floatToLreal(num: number) {
  let mant = 0,
    mant2 = 0;
  const lreal = {
    part1: 0,
    part2: 0,
  };
  let tmp,
    exp = 0,
    firstbit,
    bas = 0;

  const abs = Math.abs(num);

  if (num !== 0) {
    //Find exponent and base.
    for (let i = 1024; i >= -1023; i--) {
      tmp = abs / Math.pow(2, i);
      if (tmp >= 2) {
        break;
      }
      exp = i;
      bas = tmp;
    }
    exp += 1023;
    const bas2 = bas.toString(2);
    //Create the mantissa.
    let i = 2;
    for (i = 2; i < 22; i++) {
      mant <<= 1;
      if (bas2.charAt(i) === '1') {
        mant += 1;
      }
    }
    if (bas2.charAt(i) === '1') {
      firstbit = true;
    }
    i++;
    for (i; i < 54; i++) {
      mant2 <<= 1;
      if (bas2.charAt(i) === '1') {
        mant2 += 1;
      }
    }
    //Create the LREAL value.
    lreal.part1 = exp; //exponent
    lreal.part1 <<= 20;
    lreal.part1 += mant; //mantissa
    if (num < 0) {
      //Create negative sign.
      lreal.part1 += 2147483648;
    }
    lreal.part2 = mant2;
    if (firstbit === true) {
      lreal.part2 += 2147483648;
    }
  }
  return lreal;
}

/**
 * Convert a TOD string to a value of milliseconds.
 *
 * @param {Number} time
 * @param {String} format
 */
export function stringToTime(timestring: string, format: string) {
  const arrFormat = format.split('#');

  const arrlen = arrFormat.length;
  const regex = /:|\.|-|_/;
  let time = 0,
    cnt = 0,
    tmp;

  let splitterOk = false;

  //Check if a valid splitter is given
  for (let i = 1; i < arrlen; i++) {
    if (regex.test(arrFormat[i]) === true) {
      splitterOk = true;
    }
  }

  if (splitterOk !== true) {
    log('TAME library error: No separator ( : . - _ ) for TOD string found!');
    log('String: ' + timestring);
    log('Format: ' + format);
    //Although we could try to split the timestring in case of a
    //wrong formatting string, we don't do it.
    return 0;
  }

  const arrValues = timestring.split(regex);

  for (let i = 1; i < arrlen; i++) {
    switch (arrFormat[i]) {
      case 'h':
      case 'hh':
        tmp = parseInt(arrValues[cnt], 10) * 3600000;
        cnt++;
        break;
      case 'm':
      case 'mm':
        tmp = parseInt(arrValues[cnt], 10) * 60000;
        cnt++;
        break;
      case 's':
      case 'ss':
        tmp = parseInt(arrValues[cnt], 10) * 1000;
        cnt++;
        break;
      case 'ms':
      case 'msmsms':
        tmp = parseInt(arrValues[cnt], 10);
        cnt++;
        break;
      default:
        tmp = 0;
    }
    time += tmp;
  }
  return time;
}

/**
 * Function for converting the data values to a byte array.
 *
 * @param {Object} item     An item of the item list of a request descriptor.
 * @param {String} type     Contains the data type
 * @param {String} format   The formatting string.
 * @param {Number} len      Data length.
 * @return {Array} bytes    An array containing the data as byte values.
 */
export function dataToByteArray(
  item: { val?: number | Date | string },
  type: string,
  format: string,
  len: number,
) {
  let bytes: any[] = [],
    strlen,
    sl,
    i;

  //If no value is passed, set value to zero and log an error message.
  if (item.val === undefined) {
    switch (type) {
      case 'STRING':
        item.val = '';
        break;
      case 'DATE':
      case 'DT':
      case 'TOD':
      case 'TIME_OF_DAY':
      case 'DATE_AND_TIME':
        item.val = new Date();
        break;
      default:
        item.val = 0;
        break;
    }
    log(
      'TAME library warning: Value of a variable in write request is not defined!',
    );
    log(item);
  }

  //Depending on the data type, convert the values to a byte array.
  switch (type) {
    case 'BOOL':
      if (item.val) {
        bytes[0] = 1;
      } else {
        bytes[0] = 0;
      }
      break;
    case 'BYTE':
    case 'USINT': {
      const val = checkValue(item, type, 0, 255);
      bytes = numToByteArr(val, len);
      break;
    }
    case 'SINT': {
      let val = checkValue(item, type, -128, 127);
      if (val < 0) {
        val = val + 256;
      }
      bytes = numToByteArr(val, len);
      break;
    }
    case 'WORD':
    case 'UINT': {
      const val = checkValue(item, type, 0, 65535);
      bytes = numToByteArr(val, len);
      break;
    }
    case 'INT':
    case 'INT16': {
      let val = checkValue(item, type, -32768, 32767);
      if (val < 0) {
        val = val + 65536;
      }
      bytes = numToByteArr(val, len);
      break;
    }
    case 'INT1DP': {
      if (typeof item.val === 'number') {
        item.val = Math.round(item.val * 10);
      }
      let val = checkValue(item, type, -32768, 32767);
      if (val < 0) {
        val = val + 65536;
      }
      bytes = numToByteArr(val, len);
      break;
    }
    case 'DWORD':
    case 'UDINT': {
      const val = checkValue(item, type, 0, 4294967295);
      bytes = numToByteArr(val, len);
      break;
    }
    case 'DINT': {
      let val = checkValue(item, type, -2147483648, 2147483647);
      if (val < 0) {
        val = val + 4294967296;
      }
      bytes = numToByteArr(val, len);
      break;
    }
    case 'REAL': {
      let val = checkValue(item, type);
      val = floatToReal(val);
      bytes = numToByteArr(val, len);
      break;
    }
    case 'LREAL': {
      const val = checkValue(item, type);
      const valReal = floatToLreal(val);
      //Length set to 4, cause type length is 8 and there are 2 parts
      bytes = numToByteArr(valReal.part2, 4);
      bytes = bytes.concat(numToByteArr(valReal.part1, 4));
      break;
    }
    case 'DATE': {
      if (typeof item.val !== 'object') {
        log(
          'TAME library error: Value of a DATE variable in write request is not a date object!',
        );
        log(item);
        break;
      }
      //Delete the time portion.
      item.val.setHours(0);
      item.val.setMinutes(0);
      item.val.setSeconds(0);
      //Convert the date object in seconds since 1.1.1970 and
      //set the time zone to UTC.
      const val = item.val.getTime() / 1000 - item.val.getTimezoneOffset() * 60;

      bytes = numToByteArr(val, len);
      break;
    }
    case 'DT':
    case 'DATE_AND_TIME': {
      if (typeof item.val !== 'object') {
        //Convert the date object in seconds since 1.1.1970 and
        //set the time zone to UTC.
        log(
          'TAME library error: Value of a DT variable in write request is not a date object!',
        );
        log(item);
        break;
      }
      const val = item.val.getTime() / 1000 - item.val.getTimezoneOffset() * 60;

      bytes = numToByteArr(val, len);
      break;
    }
    case 'TOD':
    case 'TIME_OF_DAY': {
      let val = 0;
      if (typeof item.val === 'object') {
        //Delete the date portion.
        item.val.setFullYear(1970);
        item.val.setMonth(0);
        item.val.setDate(1);
        //Convert the date object in seconds since 1.1.1970 and
        //set the time zone to UTC.
        val = item.val.getTime() - item.val.getTimezoneOffset() * 60000;
      } else if (typeof item.val === 'string') {
        //If the time value is a string
        if (format === '' || format === undefined) {
          format = '#hh#:#mm';
          log(
            'TAME library warning: No format given for TOD string! Using default #hh#:#mm.',
          );
          log(item);
        }
        val = stringToTime(item.val, format);
      } else {
        log(
          'TAME library error: TOD value in write request is wether a date object nor a string!',
        );
        log(item);
      }
      bytes = numToByteArr(val, len);
      break;
    }
    case 'STRING':
      //If no length is given, set it to 80 characters (TwinCAT default).
      strlen = format === undefined ? plcTypeLen.STRING : parseInt(format, 10);

      if (isValidStringLen(strlen) && typeof item.val === 'string') {
        //If the given string length is valid and shorter then the string
        //then use the given value to avoid an overflow, otherwise use
        //the real string length.
        sl = strlen < item.val.length ? strlen : item.val.length;
        for (i = 0; i < sl; i++) {
          bytes[i] = item.val.charCodeAt(i);
        }
        //Fill the string up to the given length, if necessary.
        for (i; i < strlen; i++) {
          bytes[i] = 0;
        }
        //Termination, the real string length in the PLC is
        //the defined length + 1.
        bytes[i] = 0;
      }
      break;
    case 'TIME': {
      let val = parseInt(item.val as string, 10);
      if (isNaN(val)) {
        log(
          'TAME library warning: Value of a TIME variable in write request is not defined!',
        );
        log(item);
        val = 0;
      }
      val = toMillisec(val, format);
      if (val < 0) {
        val = 0;
        log(
          'TAME library warning: Lower limit for TIME variable in write request exceeded!)',
        );
        log('value: ' + item.val + format);
        log(item);
      } else if (val > 4294967295) {
        val = 4294967295;
        log(
          'TAME library warning: Upper limit for TIME variable in write request exceeded!)',
        );
        log('value: ' + item.val + format);
        log(item);
      }
      bytes = numToByteArr(val, len);
      break;
    }
    case 'EndStruct':
      //Do nothing.
      break;
    default:
      log('TAME library error: Unknown data type in write request : ' + type);
      break;
  }

  return bytes;
}
