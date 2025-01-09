// The URL to your TcAdsWebService WebService (For further information see
// http://infosys.beckhoff.com/english.php?content=../content/1033/tcadswebservice/html/webservice_install_xp.htm&id=10163):
const terminalIp = '192.168.1.22';
const path = '/script/TcAdsWebService/TcAdsWebService.dll';
//let url = 'http://192.168.1.21/script/TcAdsWebService/TcAdsWebService.dll';
// Your local AmsNetId
let netId = '192.168.1.21.1.1';
// Your current PLCs runtime
let port = 800;
// SOAP request refresh rate (in ms):

import http from 'http';
//import { hostname } from 'os';
import xml2js from 'xml2js';

export function convertAddress(address) {
  return 2 * (address - 16384);
}

export function readAllDataPoints() {
  let delay = 0;
  for (let v in dataPoints) {
    let dataPoint = dataPoints[v];

    if (dataPoint.loopUpdate) {
      console.log(dataPoint);
      setTimeout(
        function (dp) {
          readDataPoint(dp);
        },
        delay,
        dataPoint,
      );
      setTimeout(
        (function (dp) {
          return function () {
            readDataPoint(dp);
          };
        })(dataPoint),
        delay,
      );
      delay += 400;
    }
  }
}

const LivingAirIndexGroup = '16416';
export function readDataPoint(dataPoint) {
  let callback = function (response) {
    processResponse(response, dataPoint);
  };
  console.log('dp address ' + dataPoint.address);
  console.log('index offset ' + convertAddress(dataPoint.address));
  Read(
    netId,
    port,
    LivingAirIndexGroup,
    '' + convertAddress(dataPoint.address),
    sizes[dataPoint.type],
    callback,
  );
  return callback;
}
/// let connectionError = false;
let connectionErrorCallback;
export function listenForConnectionError(callback) {
  connectionErrorCallback = callback;
}
export let processingError = false;
export let totalADSerrors = 0;
export let errorcode = '';
let error = '';
export function processResponse(response, dataPoint) {
  console.log('aa');
  console.log(response);
  console.log('datapoint ' + dataPoint.address);
  // Check the response for errors in the request
  try {
    const parser = new xml2js.Parser();
    parser.parseString(response, (error, result) => {
      const soapEnvBody = result['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0];

      if (soapEnvBody['SOAP-ENV:Fault']) {
        soapEnvBody['SOAP-ENV:Fault'].forEach((element) => {
          console.log(element.faultcode);
          console.log(element.faultstring);
        });
        if(connectionErrorCallback) connectionErrorCallback(true);

        //showerror(errortext + " ("+errorcode+")");
        totalADSerrors += 1;
        if (totalADSerrors > 10) {
          processingError = true;
        }

        return;
      }
      try {
        // Check whether the response contains a <ppData> element. If so process it and retrieve the values.
        // If not it is a write request and therefore ignored.
        const readResponse = soapEnvBody['ns1:ReadResponse'][0];
        if (readResponse) {
          let data = readResponse['ppData'][0];
          // Since now the data is extracted from the response its contents need to be parsed so that the results can be displayed.
          //console.log("Data: " + data);
          // Decode result string
          console.log('data ' + data);
          totalADSerrors = 0;
          data = b64t2d(data);

          console.log('Data Decoded: ' + data);

          // software version
          let newVal = conversions[dataPoint.type](
            data.substring(0, sizes[dataPoint.type]),
          );
          console.log('value');
          console.log(newVal);
          dataPoint.value = newVal;
          //dataPoint.updateFunc(newVal);
          processingError = false;
        }
        return;
      } catch (e) {
        console.log('exception ' + e);
        processingError = true;
        return;
      }
    });
  } catch (e) {
    console.log(e);
  }
}

export function writeDatapoint(dataPoint, value, dontReadBack) {
  let callback;
  if (dontReadBack) {
    callback = function (response) {
      processResponse(response, dataPoint);
    };
  } else {
    callback = function (response) {
      processResponse(response, dataPoint);
      readDataPoint(dataPoint);
    };
  }

  Write(
    netId,
    port,
    LivingAirIndexGroup,
    '' + convertAddress(dataPoint.address),
    sizes[dataPoint.type],
    value,
    dataPoint.type,
    callback,
  );
}

export function writeSchaltpunkt(day, type, point, value) {
  //Safety net

  console.log('write schaltpunkt' + day + 'punkt' + point + type + value);
  if (day == 'alle' || day == 'werktage') {
    setTimeout(function () {
      writeSchaltpunkt('montag', type, point, value);
    }, 0);
    setTimeout(function () {
      writeSchaltpunkt('dienstag', type, point, value);
    }, 200);
    setTimeout(function () {
      writeSchaltpunkt('mittwoch', type, point, value);
    }, 400);
    setTimeout(function () {
      writeSchaltpunkt('donnerstag', type, point, value);
    }, 600);
    setTimeout(function () {
      writeSchaltpunkt('freitag', type, point, value);
    }, 800);

    return;
  }
  let baseAddress = 0;

  if (day == 'montag') {
    baseAddress = dataPoints.aScheduleStandardMonday.address;
  } else if (day == 'dienstag') {
    baseAddress = dataPoints.aScheduleStandardTuesday.address;
  } else if (day == 'mittwoch') {
    baseAddress = dataPoints.aScheduleStandardWednesday.address;
  } else if (day == 'donnerstag') {
    baseAddress = dataPoints.aScheduleStandardThursday.address;
  } else if (day == 'freitag') {
    baseAddress = dataPoints.aScheduleStandardFriday.address;
  } else if (day == 'samstag') {
    baseAddress = dataPoints.aScheduleStandardSaturday.address;
  } else if (day == 'sonntag') {
    baseAddress = dataPoints.aScheduleStandardSunday.address;
  }

  baseAddress = convertAddress(baseAddress);

  let offset = point * 6;

  if (type == 'minute') {
    offset += 2;
  }
  if (type == 'stufe') {
    offset += 4;
  }

  const writeAddress = baseAddress + offset;
  let callback = function (response) {
    processResponse(response, {});
  };
  Write(netId, port, LivingAirIndexGroup, '' + writeAddress, 2, value, 'int', callback);
}

let b64s = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

//sends read request using the xmlhttprequest object and SOAP
function Read(netId, nPort, indexGroup, indexOffset, cbRdLen, callback) {
  query('Read', netId, nPort, indexGroup, indexOffset, cbRdLen, '', callback);
}

//sends write request using the xmlhttprequest object and SOAP, type: int, bool or string
function Write(
  netId,
  nPort,
  indexGroup,
  indexOffset,
  cbRdLen,
  pwrData,
  type,
  callback,
) {
  console.log(
    'writing ' +
      netId +
      ' ' +
      indexGroup +
      ' ' +
      indexOffset +
      ' ' +
      cbRdLen +
      ' ' +
      pwrData,
  );
  let pData = convertWriteData(type, pwrData, cbRdLen);
  console.log('pdata');
  console.log(pData);

  query(
    'Write',
    netId,
    nPort,
    indexGroup,
    indexOffset,
    0,
    pData,
    callback,
    cbRdLen,
  );
}

export function convertWriteData(type, pwrData, cbRdLen) {
  let pData = [];
  switch (type) {
    case 'bool':
      if (pwrData == false) pData[0] = 0;
      else pData[0] = 1;
      break;
    case 'int': {
      let hex = parseInt(pwrData);
      if (hex < 0) hex = hex + 65536;
      hex = hex.toString(16);

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
      let hex = parseInt(pwrData);

      hex = hex.toString(16);

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

//sends SOAP request
function query(
  method,
  netId,
  nPort,
  indexGroup,
  indexOffset,
  cbRdLen,
  pwrData,
  callback,
  cbWrtLn,
) {
  //console.log('callback' + callback);
  // Input mode
  console.log('pwrData');
  console.log(pwrData);
  if (pwrData && pwrData.length > 0) {
    pwrData = encode_base64(pwrData);
    if (pwrData.length > cbWrtLn) {
      pwrData = pwrData.substr(0, cbWrtLn);
    }
  }
  console.log('pwrData2');
  console.log(pwrData);
  let sr = createBody(
    method,
    netId,
    nPort,
    indexGroup,
    indexOffset,
    cbRdLen,
    pwrData,
  );

  //let req = loadXMLDoc(url, callback);

  const headers = {
    Accept: '*/*',
    'Accept-Encoding': 'gzip, deflate',
    SOAPAction: 'http://beckhoff.org/action/TcAdsSync.' + method,
    'Content-Length': sr.length,
    'Content-Type': 'text/plain;charset=UTF-8',
  };

  const options = {
    hostname: terminalIp,
    port: 80,
    method: 'POST',
    headers,
    path,
  };

  const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    // Collect response data
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    // End of response
    res.on('end', () => {
      callback(data);
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  console.log(sr);
  req.write(sr);

  req.end()
}

export function createBody(
  method,
  netId,
  nPort,
  indexGroup,
  indexOffset,
  cbRdLen,
  pwrData,
) {
  let sr =
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<soap:Envelope ' +
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
    'xmlns:xsd="http://www.w3.org/2001/XMLSchema" ' +
    'xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
    '<soap:Body><q1:' +
    method +
    ' xmlns:q1="http://beckhoff.org/message/">' +
    '<netId xsi:type="xsd:string">' +
    netId +
    '</netId>' +
    '<nPort xsi:type="xsd:int">' +
    nPort +
    '</nPort>' +
    '<indexGroup xsi:type="xsd:unsignedInt">' +
    indexGroup +
    '</indexGroup>' +
    '<indexOffset xsi:type="xsd:unsignedInt">' +
    indexOffset +
    '</indexOffset>';
  if (cbRdLen > 0)
    sr += '<cbRdLen xsi:type="xsd:int">' + cbRdLen + '</cbRdLen>';
  if (pwrData && pwrData.length > 0) sr += '<pData>' + pwrData + '</pData>';
  sr += '</q1:' + method + '></soap:Body></soap:Envelope>';
  return sr;
}

function parseString(string) {
  //Swap chars
  let newString = '';
  for (let i = 0; i < string.length; i += 2) {
    newString += string[i + 1];
    newString += string[i];
  }
  return newString;
}

function parsePLCUInt(string) {
  let b64r = new Array(2);

  b64r[0] = string.charAt(1);
  b64r[1] = string.charAt(0);

  let hexs = itoa(b64r[0].charCodeAt(0), 16) + itoa(b64r[1].charCodeAt(0), 16);

  hexs = '0x' + hexs;
  let dec = parseInt(hexs);
  if (dec > 32768) dec = dec - 65536;
  return dec;
}

//decodes 'string' to an int value
function parsePLCInt(string) {
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

//trims unused characters at the end of 'string'
export function toString(string) {
  let x = 0;
  for (let i = string.length - 1; i > 0; --i) {
    if (string.charCodeAt(i) != 0) break;
    x++;
  }
  return string.substr(0, 81 - x);
}

function floatToBytes(num) {
  let mant = 0,
    real = 0,
    bas,
    abs,
    tmp,
    exp;

  abs = Math.abs(num);

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
    bas = bas.toString(2);
    //Create the mantissa.
    for (let i = 2; i < 25; i++) {
      mant <<= 1;
      if (bas.charAt(i) == '1') {
        mant += 1;
      }
    }
    if (bas.charAt(25) == '1') {
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
  let bytes = [];
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

function charcodeToDual(charcode) {
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

function parsePLCReal(string) {
  let mant = 1,
    dual = 0.5,
    num = parsePLCUDINT(string),
    sign,
    exp;

  //Return if value is zero.
  if (num === 0) {
    return 0;
  }
  //Check the sign bit.
  sign = num >>> 31 == 1 ? '-' : '+';
  num <<= 1;
  //Delete the sign bit.
  //Calculate the exponent.
  exp = (num >>> 24) - 127;
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

/**
 * Convert data string to UDINT/DWORD.
 *
 * @param {String} string
 */
function parsePLCUDINT(string) {
  let bytes = [];
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

function parsePLCBool(string) {
  let hex = numToHexString(string.charCodeAt(1));
  return parseInt(hex, 16);
}

export function reverseHexs(hexs) {
  let out = hexToCharString(hexs.substr(6, 2));
  out += hexToCharString(hexs.substr(4, 2));
  out += hexToCharString(hexs.substr(2, 2));
  out += hexToCharString(hexs.substr(0, 2));
  return out;
}

function hexToCharString(value) {
  const number = parseInt(value, 16);
  return String.fromCharCode(number);
}

function numToHexString(value) {
  let ret = value.toString(16);
  if (ret.length % 2 !== 0) {
    ret = '0' + ret;
  }
  return ret;
}

function parsePLCError(string) {
  error = {
    bActive: parsePLCInt(string.substr(0, 2)),
    year: parsePLCInt(string.substr(2, 2)),
    month: parsePLCInt(string.substr(4, 2)),
    day: parsePLCInt(string.substr(6, 2)),
    hour: parsePLCInt(string.substr(8, 2)),
    minute: parsePLCInt(string.substr(10, 2)),
    counter: parsePLCInt(string.substr(12, 2)),
  };

  return error;
}

function parseSchaltpunkt(string) {
  console.log('SP ' + string);
  console.log(string);
  const schaltpunkt = [
    {
      stunde: parsePLCInt(string.substr(0, 2)),
      minute: parsePLCInt(string.substr(2, 2)),
      stufe: parsePLCInt(string.substr(4, 2)),
    },
    {
      stunde: parsePLCInt(string.substr(6, 2)),
      minute: parsePLCInt(string.substr(8, 2)),
      stufe: parsePLCInt(string.substr(10, 2)),
    },
    {
      stunde: parsePLCInt(string.substr(12, 2)),
      minute: parsePLCInt(string.substr(14, 2)),
      stufe: parsePLCInt(string.substr(16, 2)),
    },
    {
      stunde: parsePLCInt(string.substr(18, 2)),
      minute: parsePLCInt(string.substr(20, 2)),
      stufe: parsePLCInt(string.substr(22, 2)),
    },
    {
      stunde: parsePLCInt(string.substr(24, 2)),
      minute: parsePLCInt(string.substr(26, 2)),
      stufe: parsePLCInt(string.substr(28, 2)),
    },
  ];
  for (let v in schaltpunkt) {
    let sp = schaltpunkt[v];
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
  //
  //    schaltpunkt[0].;
  //    schaltpunkt[0].stufe = ;
  //    schaltpunkt[1].stunde = parsePLCInt(string.substr(6,2));
  //    schaltpunkt[1].minute = parsePLCInt(string.substr(8,2));
  //    schaltpunkt[1].stufe = parsePLCInt(string.substr(10,2));
  //    schaltpunkt[2].stunde = parsePLCInt(string.substr(12,2));
  //    schaltpunkt[2].minute = parsePLCInt(string.substr(14,2));
  //    schaltpunkt[2].stufe = parsePLCInt(string.substr(16,2));
  //    schaltpunkt[3].stunde = parsePLCInt(string.substr(18,2));
  //    schaltpunkt[3].minute = parsePLCInt(string.substr(20,2));
  //    schaltpunkt[3].stufe = parsePLCInt(string.substr(22,2));
  //    schaltpunkt[4].stunde = parsePLCInt(string.substr(24,2));
  //    schaltpunkt[4].minute = parsePLCInt(string.substr(26,2));
  //    schaltpunkt[4].stufe = parsePLCInt(string.substr(28,2));
}

//b64 encoder
export function encode_base64(d) {
  let r = [];
  let i = 0;
  console.log('d length' + d.length);

  while (i < d.length) {
    r[r.length] = b64s.charAt(d[i] >> 2);
    r[r.length] = b64s.charAt(((d[i] & 3) << 4) | (d[i + 1] >> 4));
    r[r.length] = b64s.charAt(((d[i + 1] & 15) << 2) | (d[i + 2] >> 6));
    r[r.length] = b64s.charAt(d[i + 2] & 63);

    if (i % 57 == 54) r[r.length] = '\n';
    i += 3;
  }
  // Array in text zusammenf�hren
  return r.join('');
}

//b64 decoder
export function b64t2d(input) {
  let output = '';
  let chr1, chr2, chr3;
  let enc1, enc2, enc3, enc4;
  let i = 0;

  // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
  input = input.replace(/[^A-Za-z0-9+/=]/g, '');

  do {
    enc1 = b64s.indexOf(input.charAt(i++));
    enc2 = b64s.indexOf(input.charAt(i++));
    enc3 = b64s.indexOf(input.charAt(i++));
    enc4 = b64s.indexOf(input.charAt(i++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    output = output + String.fromCharCode(chr1);
    if (enc3 != 64) {
      output = output + String.fromCharCode(chr2);
    }
    if (enc4 != 64) {
      output = output + String.fromCharCode(chr3);
    }
  } while (i < input.length);

  return output;
}

//convert integer to string
export function itoa(value, base) {
  let l = '0123456789abcdef';
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

//convert integer to byte
export function t2b(t) {
  if (t >= 0x61 && t <= 0x66) return t - 0x57;
  if (t >= 0x41 && t <= 0x46) return t - 0x37;
  if (t >= 0x30 && t <= 0x39) return t - 0x30;
  return 0;
}

export let dataPoints = {
  //Luefterstufe
  eSetpointFanLevel: {
    address: 16786,
    value: 0,
    type: 'uint',
  },
  bAutomaticEnable: {
    address: 16934,
    value: 0,
    type: 'int',
  },
  //Startscreen
  rInputTempSensorSup: {
    address: 17286,
    value: 0,
    type: 'real',
  },

  rInputTempSensorOda: {
    address: 17284,
    value: 0,
    type: 'real',
  },
  bNightVentEnable: {
    address: 16534,
    value: 0,
    type: 'int',
  },
  bOccupiedEnable: {
    address: 16941,
    value: 0,
    type: 'uint',
  },
  uiConnectionCheckCounter: {
    address: 16536,
    value: 0,
    type: 'uint',
  },
  bPinEnable: {
    address: 16742,
    value: 0,
    type: 'int',
  },
  //WRG
  bWrgSwitchType: {
    address: 16738,
    value: 0,
    type: 'int',
  },

  //Meldesystem
  astErrorList_FrostODA: {
    address: 17145,
    value: {},
    type: 'error',
  },
  astErrorList_TempSUP: {
    address: 17152,
    value: {},
    type: 'error',
  },
  astErrorList_SensorODA: {
    address: 17159,
    value: {},
    type: 'error',
  },
  astErrorList_SensorSUP: {
    address: 17166,
    value: {},
    type: 'error',
  },
  astErrorList_RBGCom: {
    address: 17201,
    value: {},
    type: 'error',
  },
  astErrorList_DIFirePlace: {
    address: 17208,
    value: {},
    type: 'error',
  },
  astErrorList_DISmokeDetector: {
    address: 17215,
    value: {},
    type: 'error',
  },
  astErrorList_DICoverSwitch: {
    address: 17222,
    value: {},
    type: 'error',
  },
  astErrorList_FilterTime: {
    address: 17229,
    value: {},
    type: 'error',
  },
  astErrorList_SensorCO2: {
    address: 17180,
    value: {},
    type: 'error',
  },
  astErrorList_SensorHum: {
    address: 17173,
    value: {},
    type: 'error',
  },
  bSmokeDetectorEnabled: {
    address: 16385,
    value: 0,
    type: 'bool',
  },
  bCoverSwitchEnabled: {
    address: 16386,
    value: 0,
    type: 'bool',
  },
  bFirePlaceEnabled: {
    address: 16387,
    value: 0,
    type: 'bool',
  },
  //Filterwechsel
  rRemainingTimeFilter: {
    address: 17143,
    value: 0,
    type: 'real',
  },
  bResetFilterChangeIntervall: {
    address: 16938,
    value: 0,
    type: 'int',
  },

  rSetpointTempSupOffeset: {
    address: 16789,
    value: 0,
    type: 'real',
  },

  //Zeitprogramme
  aScheduleStandardMonday: {
    address: 16791,
    value: {},
    type: 'schaltpunkt',
  },
  aScheduleStandardTuesday: {
    address: 16806,
    value: {},
    type: 'schaltpunkt',
  },
  aScheduleStandardWednesday: {
    address: 16821,
    value: {},
    type: 'schaltpunkt',
  },
  aScheduleStandardThursday: {
    address: 16836,
    value: {},
    type: 'schaltpunkt',
  },
  aScheduleStandardFriday: {
    address: 16851,
    value: {},
    type: 'schaltpunkt',
  },
  aScheduleStandardSaturday: {
    address: 16866,
    value: {},
    type: 'schaltpunkt',
  },
  aScheduleStandardSunday: {
    address: 16881,
    value: {},
    type: 'schaltpunkt',
  },
  aScheduleNightVent1_Hour: {
    address: 16896,
    value: 0,
    type: 'uint',
  },
  aScheduleNightVent1_Minute: {
    address: 16897,
    value: 0,
    type: 'uint',
  },
  aScheduleNightVent2_Hour: {
    address: 16898,
    value: 0,
    type: 'uint',
  },
  aScheduleNightVent2_Minute: {
    address: 16899,
    value: 0,
    type: 'uint',
  },
  bNightVentAllowed: {
    address: 16739,
    value: 0,
    type: 'int',
  },
  bSmokeDetectorType: {
    address: 16735,
    value: 0,
    type: 'int',
  },
  bFirePlaceType: {
    address: 16736,
    value: 0,
    type: 'int',
  },
  bCoverSwitchType: {
    address: 16734,
    value: 0,
    type: 'int',
  },
  rSerialNumber: {
    address: 16984,
    value: '',
    type: 'string',
    length: 16,
  },
  stTime_Year: {
    address: 16924,
    value: -1,
    type: 'uint',
    loopUpdate: false,
  },
  stTime_Month: {
    address: 16925,
    value: -1,
    type: 'uint',
    loopUpdate: false,
  },
  stTime_Day: {
    address: 16926,
    value: -1,
    type: 'uint',
    loopUpdate: false,
  },
  stTime_Hour: {
    address: 16927,
    value: -1,
    type: 'uint',
    loopUpdate: false,
  },
  stTime_Minute: {
    address: 16928,
    value: -1,
    type: 'uint',
    loopUpdate: false,
  },
  bGetTimeFromApp: {
    address: 16745,
    value: -1,
    type: 'uint',
  },
  rControllerVersion: {
    address: 17134,
    value: 1.0,
    type: 'real',
  },
  eHumState: {
    address: 16537,
    value: 0,
    type: 'int',
  },
  eCO2State: {
    address: 16538,
    value: 0,
    type: 'int',
  },
  bCO2ControlActive: {
    address: 16750,
    value: 0,
    type: 'uint',
  },
  bHumControlActive: {
    address: 16746,
    value: 0,
    type: 'uint',
  },
  astErrorList_SensorHum_bActive: {
    address: 17173,
    value: 0,
    type: 'bool',
  },
  astErrorList_SensorCO2_bActive: {
    address: 17180,
    value: 0,
    type: 'bool',
  },
  astErrorList_FrostODA_bActive: {
    address: 17145,
    value: 0,
    type: 'bool',
  },
  astErrorList_TempSUP_bActive: {
    address: 17152,
    value: 0,
    type: 'bool',
  },
  astErrorList_SensorODA_bActive: {
    address: 17159,
    value: 0,
    type: 'bool',
  },
  astErrorList_SensorSUP_bActive: {
    address: 17166,
    value: 0,
    type: 'bool',
  },
  astErrorList_RBGCom_bActive: {
    address: 17201,
    value: 0,
    type: 'bool',
  },
  astErrorList_DIFirePlace_bActive: {
    address: 17208,
    value: 0,
    type: 'bool',
  },
  astErrorList_DISmokeDetector_bActive: {
    address: 17215,
    value: 0,
    type: 'bool',
  },
  astErrorList_DICoverSwitch_bActive: {
    address: 17222,
    value: 0,
    type: 'bool',
  },
  astErrorList_FilterTime_bActive: {
    address: 17229,
    value: 0,
    type: 'bool',
  },
};

export const sizes = {
  bool: 1,
  int: 2,
  uint: 2,
  real: 4,
  error: 14,
  schaltpunkt: 30,
  string: 16,
};

export const conversions = {
  bool: parsePLCBool,
  int: parsePLCInt,
  uint: parsePLCUInt,
  real: parsePLCReal,
  error: parsePLCError,
  schaltpunkt: parseSchaltpunkt,
  string: parseString,
};
