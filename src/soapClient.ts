import http, { OutgoingHttpHeaders } from 'http';
import xml2js from 'xml2js';

import { convertWriteData } from './encode.js';
import { encode_base64 } from './b64.js';
import { conversions } from './decode.js';
import { b64t2d } from './b64.js';
import { setTimeout } from 'timers/promises';

const scriptPath = '/script/TcAdsWebService/TcAdsWebService.dll';

export type SoapMethod = 'Write' | 'Read';

export const sizes: { [index: string]: number } = {
  bool: 1,
  int: 2,
  uint: 2,
  real: 4,
  error: 14,
  schaltpunkt: 30,
  string: 16,
};

export interface singleSchaltpunkt {
  stunde: number;
  minute: number;
  stufe: number;
}

export type daySchaltpunkte = {
  0: singleSchaltpunkt;
  1: singleSchaltpunkt;
  2: singleSchaltpunkt;
  3: singleSchaltpunkt;
  4: singleSchaltpunkt;
};

export enum dataPointTypeType {
  bool = 'bool',
  int = 'int',
  uint = 'uint',
  real = 'real',
  error = 'error',
  schaltpunkt = 'schaltpunkt',
  string = 'string',
}
export interface DataPointType {
  address: number;
  value: any;
  type: dataPointTypeType;
  loopUpdate?: boolean;
  length?: number;
}

export class SoapClient {
  requestCounter = 0;
  lastRequestId = 0;
  constructor(
    readonly terminalIp: string,
    readonly netId: string,
    readonly nPort: number,
  ) {}

  async Write(
    indexGroup: string,
    indexOffset: string,
    cbRdLen: number,
    pwrData: any,
    type: string,
  ): Promise<string> {
    const pData = SoapClient.prepareData(type, pwrData, cbRdLen);

    return this.query('Write', indexGroup, indexOffset, 0, pData);
  }

  Read(
    indexGroup: string,
    indexOffset: string,
    cbRdLen: number,
  ): Promise<string> {
    return this.query('Read', indexGroup, indexOffset, cbRdLen, '');
  }

  static createBody(
    method: SoapMethod,
    netId: string,
    nPort: string,
    indexGroup: string,
    indexOffset: string,
    cbRdLen?: number,
    pwrData?: string,
  ): string {
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
    if (cbRdLen ?? 0 > 0)
      sr += '<cbRdLen xsi:type="xsd:int">' + cbRdLen + '</cbRdLen>';
    if (pwrData && pwrData.length > 0) sr += '<pData>' + pwrData + '</pData>';
    sr += '</q1:' + method + '></soap:Body></soap:Envelope>';
    return sr;
  } //sends SOAP request

  async query(
    method: SoapMethod,
    indexGroup: any,
    indexOffset: any,
    cbRdLen: number,
    pwrData?: any,
  ): Promise<string> {
    const requestId = this.requestCounter++ + 1;

    const postBody = SoapClient.createBody(
      method,
      this.netId,
      this.nPort.toString(),
      indexGroup,
      indexOffset,
      cbRdLen,
      pwrData,
    );

    const headers = SoapClient.createHeader(method, postBody.length);

    const options = SoapClient.createRequestOptions(this.terminalIp, headers);

    while (requestId !== this.lastRequestId + 1) {
      await setTimeout(50);
    }

    return new Promise<string>((resolve, reject) => {
      const req = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);

        // Collect response data
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        // End of response
        res.on('end', () => {
          resolve(data);
          this.lastRequestId = requestId;
        });
      });

      req.on('error', (e) => {
        reject(`Problem with request: ${e.message}`);
      });

      req.write(postBody);

      req.end();
    });
  }
  totalADSerrors = 0;
  processingError = false;

  private static prepareData(type: string, pwrData: any, cbWrtLn: number) {
    pwrData = convertWriteData(type, pwrData, cbWrtLn);

    if (pwrData && pwrData.length > 0) {
      pwrData = encode_base64(pwrData);
      if (pwrData.length > (cbWrtLn ?? 0)) {
        pwrData = pwrData.slice(0, cbWrtLn);
      }
    }
    return pwrData;
  }

  private static createRequestOptions(
    proxyIp: string,
    headers: OutgoingHttpHeaders,
  ) {
    return {
      hostname: proxyIp,
      port: 80,
      method: 'POST',
      headers,
      path: scriptPath,
    };
  }

  private static createHeader(
    method: string,
    length: number,
  ): OutgoingHttpHeaders {
    return {
      Accept: '*/*',
      'Accept-Encoding': 'gzip, deflate',
      SOAPAction: 'http://beckhoff.org/action/TcAdsSync.' + method,
      'Content-Length': length,
      'Content-Type': 'text/plain;charset=UTF-8',
    };
  }

  processResponse(
    response: string,
    dataPoint: { type: string; value: any },
  ): undefined | any {
    return new Promise<any>((resolve, reject) => {
      try {
        const parser = new xml2js.Parser();
        parser.parseString(response, (error, result) => {
          if (error) {
            reject(error);
          }
          const soapEnvBody = result['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0];

          if (soapEnvBody['SOAP-ENV:Fault']) {
            soapEnvBody['SOAP-ENV:Fault'].forEach((element: any) => {
              console.log(element.faultcode);
              console.log(element.faultstring);
            });
            reject(true);

            this.totalADSerrors += 1;
            if (this.totalADSerrors > 10) {
              this.processingError = true;
            }

            reject(soapEnvBody['SOAP-ENV:Fault']);
          }

          try {
            // Check whether the response contains a <ppData> element. If so process it and retrieve the values.
            // If not it is a write request and therefore ignored.
            const readResponse = soapEnvBody['ns1:ReadResponse'];
            if (readResponse) {
              let data = readResponse[0]['ppData'][0];
              // Since now the data is extracted from the response its contents need to be parsed so that the results can be displayed.
              // Decode result string
              this.totalADSerrors = 0;
              data = b64t2d(data);

              // software version
              const newVal = conversions[dataPoint.type](
                data.slice(0, sizes[dataPoint.type]),
              );
              dataPoint.value = newVal;
              //dataPoint.updateFunc(newVal);
              this.processingError = false;

              resolve(newVal);
            }
            const writeResponse = soapEnvBody['ns1:WriteResponse'];
            if (writeResponse) {
              console.log('got write response');
              resolve(true);
            }
          } catch (e) {
            reject(e);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}
