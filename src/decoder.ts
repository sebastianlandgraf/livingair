import { getGlobals } from './globals.js';
import { fixNumbLength, numToHexString } from './helper.js';
import { log } from './log.js';

/**
 * Convert B64-substrings to data.
 *
 * @param {String} dataString
 * @param {String} type
 * @param {String, Number} format
 * @return {Mixed} data
 *
 */
export function subStringToData(
  dataString: string,
  type: string,
  format?: string,
) {
  let data;

  switch (type) {
    case 'BOOL':
      //Does this work????? Seems like.
      data = dataString.charCodeAt(0) !== 0;
      break;
    case 'BYTE':
    case 'USINT':
      data = parsePlcUsint(dataString);
      break;
    case 'SINT':
      data = parsePlcSint(dataString);
      break;
    case 'WORD':
    case 'UINT':
      data = parsePlcUint(dataString);
      break;
    case 'INT':
    case 'INT16':
      data = parsePlcInt(dataString);
      break;
    case 'INT1DP':
      data = (parsePlcInt(dataString) / 10).toFixed(1);
      break;
    case 'DWORD':
    case 'UDINT':
      data = parsePlcUdint(dataString);
      break;
    case 'DINT':
      data = parsePlcDint(dataString);
      break;
    case 'REAL':
      data = parsePlcReal(dataString);
      if (format !== undefined) {
        data = data.toFixed(parseInt(format, 10));
      }
      break;
    case 'LREAL':
      data = parsePlcLreal(dataString);
      if (format !== undefined) {
        data = data.toFixed(parseInt(format, 10));
      }
      break;
    case 'STRING':
      data = parsePlcString(dataString);
      break;
    case 'TOD':
    case 'TIME_OF_DAY':
      data = parsePlcTod(dataString, format);
      break;
    case 'TIME':
      data = parsePlcTime(dataString, format);
      break;
    case 'DT':
    case 'DATE':
    case 'DATE_AND_TIME':
      data = parsePlcDate(dataString, format);
      break;
    case 'EndStruct':
      //Just do nothing.
      break;
    default:
      log(
        'TAME library error: Unknown data type at parsing read request: ' +
          type,
      );
      break;
  }

  return data;
}

/**
 * Convert data string of a LREAL variable
 * to a JavaScript floating point number.
 *
 * @param {String} string
 */
export function parsePlcLreal(string: string) {
  let num = parsePlcUdint(string.substring(4, 8));
  let num2 = parsePlcUdint(string.substring(0, 4));
  let i = 12;
  let mant = 1;
  let dual = 0.5;

  //Return if value is zero.
  if (num === 0 && num2 === 0) {
    return 0;
  }
  //Check the sign bit.
  const sign = num >>> 31 === 1 ? '-' : '+';
  num <<= 1; //Delete the sign bit.
  //Calculate the exponent.
  const exp = (num >>> 21) - 1023;
  //Calculate the mantissa. Shift bits to left and evaluate them.
  //Part 1.
  num <<= 11;
  while (i < 32) {
    mant += num < 0 ? dual : 0; //Add if left (sign bit) bit is true.
    num <<= 1;
    dual /= 2;
    i++;
  }
  //Part 2.
  if (num2 >>> 31 === 1) {
    mant += dual;
    num2 <<= 1;
    dual /= 2;
  }
  while (i < 64) {
    mant += num2 < 0 ? dual : 0; //Add if left (sign bit) bit is true.
    num2 <<= 1;
    dual /= 2;
    i++;
  }
  return parseFloat(sign + mant * Math.pow(2, exp));
}

/**
 * Convert data string to string by simply cutting of superfluous characters.
 *
 * @param {String} string
 */
export function parsePlcString(string: string) {
  /*
        let len = string.length;
        for (let i = 0; i < len; i++) {
            if (string.charCodeAt(i) === 0) {
                break;
            }
        }
        return string.substr(0, i);
        */
  return string.split(String.fromCharCode(0))[0];
}

/**
 * Convert data string of a REAL variable
 * to a JavaScript floating point number.
 *
 * @param {String} string
 */
export function parsePlcReal(string: string) {
  let mant = 1;
  let num = parsePlcUdint(string);

  let dual = 0.5;

  //Return if value is zero.
  if (num === 0) {
    return 0;
  }
  //Check the sign bit.
  const sign = num >>> 31 === 1 ? '-' : '+';
  num <<= 1; //Delete the sign bit.
  //Calculate the exponent.
  const exp = (num >>> 24) - 127;
  //Calculate the 23 bit mantissa: Shift bits to left and evaluate them.
  num <<= 8;
  for (let i = 1; i <= 23; i++) {
    mant += num < 0 ? dual : 0; //Add if left (sign bit) bit is true.
    num <<= 1;
    dual /= 2;
  }
  return parseFloat(sign + mant * Math.pow(2, exp));
}

/**
 * Convert data string to a formatted date/time of day string.
 *
 * @param {String} string
 * @param {String} format
 */
export function parsePlcDate(string: string, format?: string) {
  //Converte to milliseconds an create a date object
  //(time base of DATE/DT variables in the PLC are seconds since 1.1.1970)
  let date = new Date(parsePlcUdint(string) * 1000);

  //Time zone correction.
  date = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

  if (format === undefined) {
    return date;
  }
  return dateToString(date, format);
}

/**
 * Convert data string to a formatted time of day string.
 *
 * @param {String} string
 * @param {String} format
 */
export function parsePlcTod(string: string, format?: string) {
  //Create a date object (time base in the PLC are milliseconds)
  let time = new Date(parsePlcUdint(string));

  //Time zone correction.
  time = new Date(time.getTime() + time.getTimezoneOffset() * 60000);

  if (format === undefined) {
    return time;
  }
  return dateToString(time, format);
}

/**
 * Convert a date object to a formatted string.
 *
 * @param {Date} time
 * @param {String} format
 */
export function dateToString(time: Date, format: string) {
  const arr = format.split('#');
  const arrlen = arr.length;
  let tstring = '';
  let tmp;

  for (let i = 1; i < arrlen; i++) {
    switch (arr[i]) {
      //Date formatting.
      case 'D':
        tmp = time.getDate();
        break;
      case 'DD':
        tmp = time.getDate();
        tmp = fixNumbLength(tmp, 2);
        break;
      case 'WD':
        tmp = time.getDay();
        break;
      case 'WKD':
        tmp = getGlobals().weekdShortNames[time.getDay()];
        break;
      case 'WEEKDAY':
        tmp = getGlobals().weekdLongNames[time.getDay()];
        break;
      case 'M':
        tmp = time.getMonth() + 1;
        break;
      case 'MM':
        tmp = time.getMonth() + 1;
        tmp = fixNumbLength(tmp, 2);
        break;
      case 'MON':
        tmp = getGlobals().monthsShortNames[time.getMonth()];
        break;
      case 'MONTH':
        tmp = getGlobals().monthsLongNames[time.getMonth()];
        break;
      case 'YY':
        tmp = time.getFullYear();
        while (tmp > 100) {
          tmp -= 100;
        }
        break;
      case 'YYYY':
        tmp = time.getFullYear();
        break;

      //Time formatting.
      case 'h':
        tmp = time.getHours();
        break;
      case 'hh':
        tmp = time.getHours();
        tmp = fixNumbLength(tmp, 2);
        break;
      case 'm':
        tmp = time.getMinutes();
        break;
      case 'mm':
        tmp = time.getMinutes();
        tmp = fixNumbLength(tmp, 2);
        break;
      case 's':
        tmp = time.getSeconds();
        break;
      case 'ss':
        tmp = time.getSeconds();
        tmp = fixNumbLength(tmp, 2);
        break;
      case 'ms':
        tmp = time.getMilliseconds();
        break;
      case 'msmsms':
        tmp = time.getMilliseconds();
        tmp = fixNumbLength(tmp, 3);
        break;
      default:
        tmp = arr[i];
        break;
    }
    tstring = tstring + tmp;
  }
  return tstring;
}

/**
 * Convert a number with a value in milliseconds to a formatted string.
 *
 * @param {Number} time
 * @param {String} format
 */
export function timeToString(time: number, format: string) {
  const arr = format.split('#');
  const arrlen = arr.length;
  let tstring = '';
  let tmp;

  for (let i = 1; i < arrlen; i++) {
    switch (arr[i]) {
      case 'd':
        if (arrlen <= 2) {
          tmp = time / 86400000;
        } else {
          tmp = Math.floor(time / 86400000);
          time = time % 86400000;
        }
        break;
      case 'dd':
        if (arrlen <= 2) {
          tmp = time / 86400000;
        } else {
          tmp = Math.floor(time / 86400000);
          time = time % 86400000;
        }
        tmp = fixNumbLength(tmp, 2);
        break;
      case 'h':
        if (arrlen <= 2) {
          tmp = time / 3600000;
        } else {
          tmp = Math.floor(time / 3600000);
          time = time % 3600000;
        }
        break;
      case 'hh':
        if (arrlen <= 2) {
          tmp = time / 3600000;
        } else {
          tmp = Math.floor(time / 3600000);
          time = time % 3600000;
        }
        tmp = fixNumbLength(tmp, 2);
        break;
      case 'm':
        if (arrlen <= 2) {
          tmp = time / 60000;
        } else {
          tmp = Math.floor(time / 60000);
          time = time % 60000;
        }
        break;
      case 'mm':
        if (arrlen <= 2) {
          tmp = time / 60000;
        } else {
          tmp = Math.floor(time / 60000);
          time = time % 60000;
        }
        tmp = fixNumbLength(tmp, 2);
        break;
      case 's':
        if (arrlen <= 2) {
          tmp = time / 1000;
        } else {
          tmp = Math.floor(time / 1000);
          time = time % 1000;
        }
        break;
      case 'ss':
        if (arrlen <= 2) {
          tmp = time / 1000;
        } else {
          tmp = Math.floor(time / 1000);
          time = time % 1000;
        }
        tmp = fixNumbLength(tmp, 2);
        break;
      case 'ms':
        tmp = time;
        break;
      case 'msmsms':
        tmp = time;
        tmp = fixNumbLength(tmp, 3);
        break;
      default:
        tmp = arr[i];
        break;
    }
    tstring = tstring + tmp;
  }
  return tstring;
}

/**
 * Convert data string to USINT/BYTE.
 *
 * @param {String} string
 */
export function parsePlcUsint(string: string) {
  const hexs = numToHexString(string.charCodeAt(0));
  return parseInt(hexs, 16);
}

/**
 * Convert data string to SINT.
 *
 * @param {String} string
 */
export function parsePlcSint(string: string) {
  let dec = parsePlcUsint(string);
  if (dec > 127) {
    dec = dec - 256;
  }
  return dec;
}

/**
 * Convert data string to UINT/WORD.
 *
 * @param {String} string
 */
export function parsePlcUint(string: string) {
  let hexs = numToHexString(string.charCodeAt(1));
  hexs += numToHexString(string.charCodeAt(0));
  return parseInt(hexs, 16);
}

/**
 * Convert data string to INT.
 *
 * @param {String} string
 */
export function parsePlcInt(string: string) {
  let dec = parsePlcUint(string);
  if (dec > 32767) {
    dec = dec - 65536;
  }
  return dec;
}

/**
 * Convert data string to UDINT/DWORD.
 *
 * @param {String} string
 */
function parsePlcUdint(string: string) {
  let hexs = numToHexString(string.charCodeAt(3));
  hexs += numToHexString(string.charCodeAt(2));
  hexs += numToHexString(string.charCodeAt(1));
  hexs += numToHexString(string.charCodeAt(0));
  return parseInt(hexs, 16);
}

/**
 * Convert data string to DINT.
 *
 * @param {String} string
 */
export function parsePlcDint(string: string) {
  let dec = parsePlcUdint(string);
  if (dec > 2147483647) {
    dec = dec - 4294967296;
  }
  return dec;
}

/**
 * Convert data string to a formatted time string
 *
 * @param {String} string
 * @param {String} format
 */
export function parsePlcTime(string: string, format?: string) {
  const time = parsePlcUdint(string);
  if (format === undefined) {
    return time; //Unformatted: value in milliseconds.
  }
  return timeToString(time, format);
}
