export function t2b(t: number) {
  if (t >= 0x61 && t <= 0x66) return t - 0x57;
  if (t >= 0x41 && t <= 0x46) return t - 0x37;
  if (t >= 0x30 && t <= 0x39) return t - 0x30;
  return 0;
}

function charcodeToDual(charcode: number): number {
  if (charcode >= 0x61 && charcode <= 0x66) {
    return charcode - 0x57;
    //a-f
  }
  if (charcode >= 0x41 && charcode <= 0x46) {
    return charcode - 0x37;
    //A-F
  }
  if (charcode >= 0x30 && charcode <= 0x39) {
    return charcode - 0x30;
    //0-9
  }
  return 0;
}

function floatToBytes(num: number) {
  let mant = 0,
    bas = 0,
    tmp,
    real = 0,
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
    const basString = bas.toString(2);
    //Create the mantissa.
    for (let i = 2; i < 25; i++) {
      mant <<= 1;
      if (basString.charAt(i) == '1') {
        mant += 1;
      }
    }
    if (basString.charAt(25) == '1') {
      mant += 1;
    }
    //Create the REAL value.
    real = exp;
    //exponent
    real <<= 23;
    real += mant;
    //mantissa
    if (num < 0) {
      //Create negative sign.
      real += 2147483648;
    }
  }
  const bytes = [];
  let hex = real.toString(16);

  while (hex.length < 4 * 2) {
    hex = '0' + hex;
  }

  bytes[2] =
    charcodeToDual(hex.charCodeAt(3 * 2)) * 16 +
    charcodeToDual(hex.charCodeAt(3 * 2 + 1));
  bytes[3] =
    charcodeToDual(hex.charCodeAt(2 * 2)) * 16 +
    charcodeToDual(hex.charCodeAt(2 * 2 + 1));
  bytes[0] =
    charcodeToDual(hex.charCodeAt(1 * 2)) * 16 +
    charcodeToDual(hex.charCodeAt(1 * 2 + 1));
  bytes[1] =
    charcodeToDual(hex.charCodeAt(0 * 2)) * 16 +
    charcodeToDual(hex.charCodeAt(0 * 2 + 1));

  // let realString = '';
  // for (let i = 0; i < bytes.length; i++) {
  //   realString += String.fromCharCode(bytes[i]);
  // }
  return bytes;
}

export function convertWriteData(type: string, pwrData: any, cbRdLen: number) {
  let pData = [];
  switch (type) {
    case 'bool':
      if (pwrData === false) pData[0] = 0;
      else pData[0] = 1;
      break;
    case 'int': {
      let hexNum = parseInt(pwrData);
      if (hexNum < 0) hexNum = hexNum + 65536;
      let hex = hexNum.toString(16);

      while (hex.length < cbRdLen * 2) hex = '0' + hex;

      for (let i = 0; i < cbRdLen; i++) {
        pData[cbRdLen - 1 - i] =
          t2b(hex.charCodeAt(i * 2)) * 16 + t2b(hex.charCodeAt(i * 2 + 1));
      }
      break;
    }
    case 'real':
      //            let hex = parseFloat(pwrData);
      //            if (hex < 0)
      //                hex = hex + 65536;
      //            hex = hex.toString(16);
      //
      //            while(hex.length<cbRdLen*2)
      //                hex = "0"+hex;
      //            console.log("hex " + hex)
      //            let j = 0;
      //            for(let i=0; i<cbRdLen; i++)
      //            {
      //                pData[(cbRdLen-1)-i] = ((t2b(hex.charCodeAt(i*2))*16) + t2b(hex.charCodeAt((i*2)+1)));
      //            }
      pData = floatToBytes(parseFloat(pwrData));
      break;
    case 'uint': {
      const hexNum = parseInt(pwrData);

      let hex = hexNum.toString(16);

      while (hex.length < cbRdLen * 2) hex = '0' + hex;

      for (let i = 0; i < cbRdLen; i++) {
        pData[cbRdLen - 1 - i] =
          t2b(hex.charCodeAt(i * 2)) * 16 + t2b(hex.charCodeAt(i * 2 + 1));
      }
      break;
    }

    default: {
      let i = 0;
      //string
      for (i = 0; i < pwrData.length; i++) {
        pData[i] = pwrData.charCodeAt(i);
      }
      pData[i] = 0;
      break;
    }
  }
  return pData;
}
