import http from 'http';
import xml2js from 'xml2js';

import { convertWriteData } from './encode.js';
import { encode_base64 } from './b64.js';
import { conversions } from './decode.js';
import { b64t2d } from './b64.js';

const scriptPath = '/script/TcAdsWebService/TcAdsWebService.dll';

export type ClientCallback = (response: string, error?: Error) => void;

export type SoapMethod = 'Write' | 'Read';

export const sizes: { [inde: string]: number } = {
  bool: 1,
  int: 2,
  uint: 2,
  real: 4,
  error: 14,
  schaltpunkt: 30,
  string: 16,
};

export class SoapClient {
  constructor(
    readonly terminalIp: string,
    readonly netId: string,
    readonly nPort: number,
  ) {}

  connectionErrorCallback: undefined | ((error: boolean) => void) = undefined;
  listenForConnectionError(callback: (error: boolean) => void) {
    this.connectionErrorCallback = callback;
  }

  Write(
    indexGroup: string,
    indexOffset: string,
    cbRdLen: number,
    pwrData: any,
    type: string,
    callback: ClientCallback,
  ) {
    const pData = convertWriteData(type, pwrData, cbRdLen);
    console.log('pdata');
    console.log(pData);

    SoapClient.query(
      'Write',
      this.terminalIp,
      this.netId,
      this.nPort,
      indexGroup,
      indexOffset,
      0,
      callback,
      pData,
      cbRdLen,
    );
  }

  Read(
    indexGroup: string,
    indexOffset: string,
    cbRdLen: number,
    callback: ClientCallback,
  ) {
    SoapClient.query(
      'Read',
      this.terminalIp,
      this.netId,
      this.nPort,
      indexGroup,
      indexOffset,
      cbRdLen,
      callback,
      '',
    );
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

  static query(
    method: SoapMethod,
    proxyIp: string,
    netId: any,
    nPort: any,
    indexGroup: any,
    indexOffset: any,
    cbRdLen: number,
    callback: ClientCallback,
    pwrData?: any,
    cbWrtLn?: number,
  ) {
    // Input mode

    if (pwrData && pwrData.length > 0) {
      pwrData = encode_base64(pwrData);
      if (pwrData.length > (cbWrtLn ?? 0)) {
        pwrData = pwrData.substr(0, cbWrtLn);
      }
    }
    const postBody = SoapClient.createBody(
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
      'Content-Length': postBody.length,
      'Content-Type': 'text/plain;charset=UTF-8',
    };

    const options = {
      hostname: proxyIp,
      port: 80,
      method: 'POST',
      headers,
      path: scriptPath,
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
      callback('', new Error(`Problem with request: ${e.message}`));
    });

    console.log(postBody);
    req.write(postBody);

    req.end();
  }
  totalADSerrors = 0;
  processingError = false;

  processResponse(response: string, dataPoint: { type: string; value: any }) {
    console.log('aa');
    console.log(response);
    //console.log('datapoint ' + dataPoint.address);
    // Check the response for errors in the request
    try {
      const parser = new xml2js.Parser();
      parser.parseString(response, (error, result) => {
        const soapEnvBody = result['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0];

        if (soapEnvBody['SOAP-ENV:Fault']) {
          soapEnvBody['SOAP-ENV:Fault'].forEach((element: any) => {
            console.log(element.faultcode);
            console.log(element.faultstring);
          });
          if (this.connectionErrorCallback) this.connectionErrorCallback(true);

          //showerror(errortext + " ("+errorcode+")");
          this.totalADSerrors += 1;
          if (this.totalADSerrors > 10) {
            this.processingError = true;
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
            this.totalADSerrors = 0;
            data = b64t2d(data);

            console.log('Data Decoded: ' + data);

            // software version
            const newVal = conversions[dataPoint.type](
              data.substring(0, sizes[dataPoint.type]),
            );
            console.log('value');
            console.log(newVal);
            dataPoint.value = newVal;
            //dataPoint.updateFunc(newVal);
            this.processingError = false;
          }
          return;
        } catch (e) {
          console.log('exception ' + e);
          this.processingError = true;
          return;
        }
      });
    } catch (e) {
      console.log(e);
    }
  }
}
export interface DataPointType {
  address: number;
  value: any;
  type: string;
  loopUpdate?: boolean;
  length?: number;
}
