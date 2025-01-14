export function itoa(value: number, base: number): string {
  const l = '0123456789abcdef';
  let buf = '';

  // check that the base if valid
  if (base < 2 || base > 16) return buf;

  let quotient = value;
  // Translating number to string with base:

  do {
    buf += l.charAt(Math.abs(quotient % base));
    quotient /= base;
  } while (quotient > 0);

  //reverse
  let ret = '';
  for (let i = buf.length < 2 ? buf.length - 1 : 1; i >= 0; --i) {
    ret += buf.charAt(i);
  }
  return ret;
}

function parseString(string: string) {
  //Swap chars
  let newString = '';
  for (let i = 0; i < string.length; i += 2) {
    newString += string[i + 1];
    newString += string[i];
  }
  return newString;
}

function parsePLCUInt(string: string) {
  const b64r = new Array(2);

  b64r[0] = string.charAt(1);
  b64r[1] = string.charAt(0);

  let hexs = itoa(b64r[0].charCodeAt(0), 16) + itoa(b64r[1].charCodeAt(0), 16);

  hexs = '0x' + hexs;
  let dec = parseInt(hexs);
  if (dec > 32768) dec = dec - 65536;
  return dec;
}

function parsePLCInt(string: string) {
  //    let b64r = new Array(2);
  //
  //    b64r[0]=string.charAt(1);
  //    b64r[1]=string.charAt(0);
  //
  //    hexs = itoa(b64r[0].charCodeAt(0),16) + itoa(b64r[1].charCodeAt(0),16);
  //
  //    hexs = "0x" + hexs;
  let dec = parsePLCUInt(string);
  if (dec > 32768) dec = dec - 65536;
  return dec;
}

function parsePLCUDINT(string: string) {
  const bytes = [4];
  bytes[0] = string.charCodeAt(0);
  bytes[1] = string.charCodeAt(1);
  bytes[2] = string.charCodeAt(2);
  bytes[3] = string.charCodeAt(3);

  let hexs = numToHexString(string.charCodeAt(1));
  hexs += numToHexString(string.charCodeAt(0));
  hexs += numToHexString(string.charCodeAt(3));
  hexs += numToHexString(string.charCodeAt(2));

  return parseInt(hexs, 16);
}

function parsePLCReal(string: string) {
  let mant = 1;
  let dual = 0.5;
  let num = parsePLCUDINT(string);

  //Return if value is zero.
  if (num === 0) {
    return 0;
  }
  //Check the sign bit.
  const sign = num >>> 31 == 1 ? '-' : '+';
  num <<= 1;
  //Delete the sign bit.
  //Calculate the exponent.
  const exp = (num >>> 24) - 127;
  //Calculate the 23 bit mantissa: Shift bits to left and evaluate them.
  num <<= 8;
  for (let i = 1; i <= 23; i++) {
    mant += num < 0 ? dual : 0;
    //Add if left (sign bit) bit is true.
    num <<= 1;
    dual /= 2;
  }
  return parseFloat(sign + mant * Math.pow(2, exp));
}

function parseSchaltpunkt(string: string) {
  const schaltpunkt = [
    {
      stunde: parsePLCInt(string.slice(0, 2)),
      minute: parsePLCInt(string.slice(2, 4)),
      stufe: parsePLCInt(string.slice(4, 6)),
    },
    {
      stunde: parsePLCInt(string.slice(6, 8)),
      minute: parsePLCInt(string.slice(8, 10)),
      stufe: parsePLCInt(string.slice(10, 12)),
    },
    {
      stunde: parsePLCInt(string.slice(12, 14)),
      minute: parsePLCInt(string.slice(14, 16)),
      stufe: parsePLCInt(string.slice(16, 18)),
    },
    {
      stunde: parsePLCInt(string.slice(18, 20)),
      minute: parsePLCInt(string.slice(20, 22)),
      stufe: parsePLCInt(string.slice(22, 24)),
    },
    {
      stunde: parsePLCInt(string.slice(24, 26)),
      minute: parsePLCInt(string.slice(26, 28)),
      stufe: parsePLCInt(string.slice(28, 30)),
    },
  ];
  for (const v in schaltpunkt) {
    const sp = schaltpunkt[v];
    if (sp.stunde > 24 || sp.stunde < 0) {
      sp.stunde = 0;
    }
    if (sp.minute > 59 || sp.minute < 0) {
      sp.minute = 0;
    }
    if (sp.stufe > 4 || sp.stufe < 0) {
      sp.stufe = 0;
    }
  }
  return schaltpunkt;
}

export const conversions: { [index: string]: (value: string) => any } = {
  bool: parsePLCBool,
  int: parsePLCInt,
  uint: parsePLCUInt,
  real: parsePLCReal,
  error: parsePLCError,
  schaltpunkt: parseSchaltpunkt,
  string: parseString,
};

function parsePLCError(string: string) {
  const error = {
    bActive: parsePLCInt(string.slice(0, 2)),
    year: parsePLCInt(string.slice(2, 4)),
    month: parsePLCInt(string.slice(4, 6)),
    day: parsePLCInt(string.slice(6, 8)),
    hour: parsePLCInt(string.slice(8, 10)),
    minute: parsePLCInt(string.slice(10, 12)),
    counter: parsePLCInt(string.slice(12, 14)),
  };

  return error;
}

function numToHexString(value: number) {
  let ret = value.toString(16);
  if (ret.length % 2 !== 0) {
    ret = '0' + ret;
  }
  return ret;
}

function parsePLCBool(string: string): number {
  const hex = numToHexString(string.charCodeAt(1));
  return parseInt(hex, 16);
}
