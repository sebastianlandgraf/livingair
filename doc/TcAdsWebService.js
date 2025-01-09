/*!
--------------
TcAdsWebService JavaScript Library
--------------
Version: v1.0.1.0
--------------
Copyright 2012, Beckhoff Automation GmbH
http://www.beckhoff.com
--------------
Description:
    
--------------
*/
////////////////////////////////////////////////////
(function (window) {
  let TcAdsWebService = new (function () {
    this.Response = function (hasError, error, reader, isBusy) {
      this.isBusy = isBusy;
      this.hasError = hasError;
      this.error = error;
      this.reader = reader;
      this.getTypeString = function () {
        return 'TcAdsWebService.Response';
      };
    };

    this.Error = function (errorMessage, errorCode) {
      this.errorMessage = errorMessage;
      this.errorCode = errorCode;
      this.getTypeString = function () {
        return 'TcAdsWebService.Error';
      };
    };

    this.ResquestError = function (requestStatus, requestStatusText) {
      this.requestStatus = requestStatus;
      this.requestStatusText = requestStatusText;
      this.getTypeString = function () {
        return 'TcAdsWebService.ResquestError';
      };
    };

    this.Client = function (sServiceUrl, sServiceUser, sServicePassword) {
      this.getTypeString = function () {
        return 'TcAdsWebService.Client';
      };

      this.readwrite = function (
        sNetId,
        nPort,
        nIndexGroup,
        nIndexOffset,
        cbRdLen,
        pwrData,
        pCallback,
        userState,
        ajaxTimeout,
        ajaxTimeoutCallback,
        async,
      ) {
        let message =
          '<?xml version="1.0" encoding="utf-8"?>' +
          '<SOAP-ENV:Envelope ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance/" ' +
          'xmlns:xsd="http://www.w3.org/2001/XMLSchema/" ' +
          'xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" ' +
          'SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" >' +
          '<SOAP-ENV:Body><q1:ReadWrite xmlns:q1="http://beckhoff.org/message/">' +
          '<netId xsi:type="xsd:string">' +
          sNetId +
          '</netId>' +
          '<nPort xsi:type="xsd:int">' +
          nPort +
          '</nPort>' +
          '<indexGroup xsi:type="xsd:unsignedInt">' +
          nIndexGroup +
          '</indexGroup>' +
          '<indexOffset xsi:type="xsd:unsignedInt">' +
          nIndexOffset +
          '</indexOffset>' +
          '<cbRdLen xsi:type="xsd:int">' +
          cbRdLen +
          '</cbRdLen>' +
          '<pwrData xsi:type="xsd:base64Binary">' +
          pwrData +
          '</pwrData>' +
          '</q1:ReadWrite></SOAP-ENV:Body></SOAP-ENV:Envelope>';

        return sendMessage(
          message,
          'http://beckhoff.org/action/TcAdsSync.Readwrite',
          pCallback,
          userState,
          ajaxTimeout,
          ajaxTimeoutCallback,
          async,
        );
      };

      this.readState = function (
        sNetId,
        nPort,
        pCallback,
        userState,
        ajaxTimeout,
        ajaxTimeoutCallback,
        async,
      ) {
        let message =
          '<?xml version="1.0" encoding="utf-8"?>' +
          '<SOAP-ENV:Envelope ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance/" ' +
          'xmlns:xsd="http://www.w3.org/2001/XMLSchema/" ' +
          'xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" ' +
          'SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" >' +
          '<SOAP-ENV:Body><q1:ReadState xmlns:q1="http://beckhoff.org/message/">' +
          '<netId xsi:type="xsd:string">' +
          sNetId +
          '</netId>' +
          '<nPort xsi:type="xsd:int">' +
          nPort +
          '</nPort>' +
          '</q1:ReadState></SOAP-ENV:Body></SOAP-ENV:Envelope>';

        return sendMessage(
          message,
          'http://beckhoff.org/action/TcAdsSync.ReadState',
          pCallback,
          userState,
          ajaxTimeout,
          ajaxTimeoutCallback,
          async,
        );
      };

      this.writeControl = function (
        sNetId,
        nPort,
        adsState,
        deviceState,
        pData,
        pCallback,
        userState,
        ajaxTimeout,
        ajaxTimeoutCallback,
        async,
      ) {
        let message =
          '<?xml version="1.0" encoding="utf-8"?>' +
          '<SOAP-ENV:Envelope ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance/" ' +
          'xmlns:xsd="http://www.w3.org/2001/XMLSchema/" ' +
          'xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" ' +
          'SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" >' +
          '<SOAP-ENV:Body><q1:WriteControl xmlns:q1="http://beckhoff.org/message/">' +
          '<netId xsi:type="xsd:string">' +
          sNetId +
          '</netId>' +
          '<nPort xsi:type="xsd:int">' +
          nPort +
          '</nPort>' +
          '<adsState xsi:type="xsd:int">' +
          adsState +
          '</adsState>' +
          '<deviceState xsi:type="xsd:int">' +
          deviceState +
          '</deviceState>' +
          '<pData xsi:type="xsd:base64Binary">' +
          pData +
          '</pData>' +
          '</q1:WriteControl></SOAP-ENV:Body></SOAP-ENV:Envelope>';

        return sendMessage(
          message,
          'http://beckhoff.org/action/TcAdsSync.WriteControl',
          pCallback,
          userState,
          ajaxTimeout,
          ajaxTimeoutCallback,
          async,
        );
      };

      this.write = function (
        sNetId,
        nPort,
        nIndexGroup,
        nIndexOffset,
        pData,
        pCallback,
        userState,
        ajaxTimeout,
        ajaxTimeoutCallback,
        async,
      ) {
        let message =
          '<?xml version="1.0" encoding="utf-8"?>' +
          '<SOAP-ENV:Envelope ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance/" ' +
          'xmlns:xsd="http://www.w3.org/2001/XMLSchema/" ' +
          'xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" ' +
          'SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" >' +
          '<SOAP-ENV:Body><q1:Write xmlns:q1="http://beckhoff.org/message/">' +
          '<netId xsi:type="xsd:string">' +
          sNetId +
          '</netId>' +
          '<nPort xsi:type="xsd:int">' +
          nPort +
          '</nPort>' +
          '<indexGroup xsi:type="xsd:unsignedInt">' +
          nIndexGroup +
          '</indexGroup>' +
          '<indexOffset xsi:type="xsd:unsignedInt">' +
          nIndexOffset +
          '</indexOffset>' +
          '<pData xsi:type="xsd:base64Binary">' +
          pData +
          '</pData>' +
          '</q1:Write></SOAP-ENV:Body></SOAP-ENV:Envelope>';

        return sendMessage(
          message,
          'http://beckhoff.org/action/TcAdsSync.Write',
          pCallback,
          userState,
          ajaxTimeout,
          ajaxTimeoutCallback,
          async,
        );
      };

      this.read = function (
        sNetId,
        nPort,
        nIndexGroup,
        nIndexOffset,
        cbLen,
        pCallback,
        userState,
        ajaxTimeout,
        ajaxTimeoutCallback,
        async,
      ) {
        let message =
          '<?xml version="1.0" encoding="utf-8"?>' +
          '<SOAP-ENV:Envelope ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance/" ' +
          'xmlns:xsd="http://www.w3.org/2001/XMLSchema/" ' +
          'xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" ' +
          'SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" >' +
          '<SOAP-ENV:Body><q1:Read xmlns:q1="http://beckhoff.org/message/">' +
          '<netId xsi:type="xsd:string">' +
          sNetId +
          '</netId>' +
          '<nPort xsi:type="xsd:int">' +
          nPort +
          '</nPort>' +
          '<indexGroup xsi:type="xsd:unsignedInt">' +
          nIndexGroup +
          '</indexGroup>' +
          '<indexOffset xsi:type="xsd:unsignedInt">' +
          nIndexOffset +
          '</indexOffset>' +
          '<cbLen xsi:type="xsd:int">' +
          cbLen +
          '</cbLen>' +
          '</q1:Read></SOAP-ENV:Body></SOAP-ENV:Envelope>';

        return sendMessage(
          message,
          'http://beckhoff.org/action/TcAdsSync.Read',
          pCallback,
          userState,
          ajaxTimeout,
          ajaxTimeoutCallback,
          async,
        );
      };

      let handleSyncResponse = function (xhr) {
        let errorMessage = undefined,
          errorCode = 0;

        if (xhr.readyState != 4 || xhr.status != 200) {
          // Request has been aborted.
          //  Maybe because of timeout.
          let resp = undefined;
          try {
            resp = new TcAdsWebService.Response(
              true,
              new TcAdsWebService.ResquestError(xhr.status, xhr.statusText),
              undefined,
              false,
            );
          } catch (err) {
            // Internet Explorer throws exception on abort
            resp = new TcAdsWebService.Response(
              true,
              new TcAdsWebService.ResquestError(0, 0),
              undefined,
              false,
            );
          }

          return resp;
        }

        let sSoapResponse = xhr.responseXML.documentElement;
        let faultstringNodes =
          sSoapResponse.getElementsByTagName('faultstring');
        if (faultstringNodes.length != 0) {
          errorMessage = faultstringNodes[0].firstChild.data;
          let errorCodeNodes = sSoapResponse.getElementsByTagName('errorcode');

          if (errorCodeNodes.length != 0) {
            errorCode =
              sSoapResponse.getElementsByTagName('errorcode')[0].firstChild
                .data;
          } else {
            errorCode = '-';
          }

          let resp = new TcAdsWebService.Response(
            true,
            new TcAdsWebService.Error(errorMessage, errorCode),
            undefined,
            false,
          );
          return resp;
        } else {
          let ppDataNodes = sSoapResponse.getElementsByTagName('ppData');
          let ppRdDataNodes = sSoapResponse.getElementsByTagName('ppRdData');
          let pAdsStateNodes = sSoapResponse.getElementsByTagName('pAdsState');
          let pDeviceStateNodes =
            sSoapResponse.getElementsByTagName('pDeviceState');

          let soapData = undefined;
          if (ppDataNodes.length != 0) {
            //read
            soapData = ppDataNodesfirstChild.data;
          } else if (ppRdDataNodes.length != 0) {
            // readwrite
            soapData = ppRdDataNodes[0].firstChild.data;
          } else if (pAdsStateNodes.length != 0 && pDeviceStateNodes.length) {
            // readState
            let adsState = pAdsStateNodes[0].firstChild.data;
            let deviceState = pDeviceStateNodes[0].firstChild.data;

            let writer = new TcAdsWebService.DataWriter();
            writer.writeWORD(parseInt(adsState, 10));
            writer.writeWORD(parseInt(deviceState, 10));

            soapData = writer.getBase64EncodedData();
          }

          if (soapData) {
            let resp = new TcAdsWebService.Response(
              false,
              undefined,
              new TcAdsWebService.DataReader(soapData),
              false,
            );
            return resp;
          } else {
            // write completes without data in response
            let resp = new TcAdsWebService.Response(
              false,
              undefined,
              undefined,
              false,
            );
            return resp;
          }
        }
      };

      let handleAsyncResponse = function (xhr, pCallback, userState) {
        if (xhr.readyState < 4) {
          if (pCallback) {
            let resp = new TcAdsWebService.Response(
              false,
              undefined,
              undefined,
              true,
            );
            pCallback(resp, userState);
          }
        }

        if (xhr.readyState == 4) {
          if (xhr.status == 200) {
            let errorMessage = undefined,
              errorCode = 0;

            let sSoapResponse = xhr.responseXML.documentElement;
            let faultstringNodes =
              sSoapResponse.getElementsByTagName('faultstring');
            if (faultstringNodes.length != 0) {
              errorMessage = faultstringNodes[0].firstChild.data;
              let errorCodeNodes =
                sSoapResponse.getElementsByTagName('errorcode');

              if (errorCodeNodes.length != 0) {
                errorCode =
                  sSoapResponse.getElementsByTagName('errorcode')[0].firstChild
                    .data;
              } else {
                errorCode = '-';
              }

              if (pCallback) {
                let resp = new TcAdsWebService.Response(
                  true,
                  new TcAdsWebService.Error(errorMessage, errorCode),
                  undefined,
                  false,
                );
                pCallback(resp, userState);
              }
            } else {
              let ppDataNodes = sSoapResponse.getElementsByTagName('ppData');
              let ppRdDataNodes =
                sSoapResponse.getElementsByTagName('ppRdData');
              let pAdsStateNodes =
                sSoapResponse.getElementsByTagName('pAdsState');
              let pDeviceStateNodes =
                sSoapResponse.getElementsByTagName('pDeviceState');

              let soapData = undefined;
              if (ppDataNodes.length != 0) {
                //read
                soapData = ppDataNodesfirstChild.data;
              } else if (ppRdDataNodes.length != 0) {
                // readwrite
                soapData = ppRdDataNodes[0].firstChild.data;
              } else if (
                pAdsStateNodes.length != 0 &&
                pDeviceStateNodes.length
              ) {
                // readState
                let adsState = pAdsStateNodes[0].firstChild.data;
                let deviceState = pDeviceStateNodes[0].firstChild.data;

                let writer = new TcAdsWebService.DataWriter();
                writer.writeWORD(parseInt(adsState, 10));
                writer.writeWORD(parseInt(deviceState, 10));

                soapData = writer.getBase64EncodedData();
              }

              if (soapData) {
                if (pCallback) {
                  let resp = new TcAdsWebService.Response(
                    false,
                    undefined,
                    new TcAdsWebService.DataReader(soapData),
                    false,
                  );
                  if (pCallback) pCallback(resp, userState);
                }
              } else {
                // write completes without data in response
                if (pCallback) {
                  let resp = new TcAdsWebService.Response(
                    false,
                    undefined,
                    undefined,
                    false,
                  );
                  pCallback(resp, userState);
                }
              }
            }
          } else {
            // Request has been aborted.
            //  Maybe because of timeout.
            if (pCallback) {
              let resp = undefined;
              try {
                resp = new RTcAdsWebService.esponse(
                  true,
                  new TcAdsWebService.ResquestError(xhr.status, xhr.statusText),
                  undefined,
                  false,
                );
              } catch (err) {
                // Internet Explorer throws exception on abort
                resp = new TcAdsWebService.Response(
                  true,
                  new TcAdsWebService.ResquestError(0, 0),
                  undefined,
                  false,
                );
              }
              pCallback(resp, userState);
            }
          }
        }
      };

      let sendMessage = function (
        message,
        method,
        pCallback,
        userState,
        ajaxTimeout,
        ajaxTimeoutCallback,
        async,
      ) {
        if (async == null || async == undefined) async = true;

        let xhr = undefined;
        if (window.XMLHttpRequest) {
          xhr = new XMLHttpRequest();
        } else {
          try {
            // MS Internet Explorer (ab v6)
            xhr = ActiveXObject('Microsoft.XMLHTTP');
          } catch (e) {
            try {
              // MS Internet Explorer (ab v5)
              xhr = new ActiveXObject('Msxml2.XMLHTTP');
            } catch (e) {
              xhr = undefined;
            }
          }
        }

        if (xhr == undefined) return null;

        if (async) {
          xhr.onreadystatechange = function () {
            handleAsyncResponse(xhr, pCallback, userState);
          };
        }

        if (sServiceUser && sServicePassword) {
          xhr.open('POST', sServiceUrl, async, sServiceUser, sServicePassword);
        } else {
          xhr.open('POST', sServiceUrl, async);
        }

        if ('timeout' in xhr && ajaxTimeout) xhr.timeout = ajaxTimeout;

        if ('ontimeout' in xhr && ajaxTimeoutCallback) {
          xhr.ontimeout = ajaxTimeoutCallback;
        }

        xhr.setRequestHeader('Content-Type', 'text/xml; charset=utf-8');

        xhr.send(message);

        if (!async) {
          return handleSyncResponse(xhr);
        } else {
          return null;
        }
      };
    };

    this.DataReader = function (data) {
      this.offset = 0;
      this.decodedData = Base64.decode(data);

      this.getTypeString = function () {
        return 'TcAdsWebService.DataReader';
      };

      this.readSINT = function () {
        let res = convertDataToInt(this.decodedData.substr(this.offset, 1), 1);
        this.offset = this.offset + 1;
        return res;
      };

      this.readINT = function () {
        let res = convertDataToInt(this.decodedData.substr(this.offset, 2), 2);
        this.offset = this.offset + 2;
        return res;
      };

      this.readDINT = function () {
        let res = convertDataToInt(this.decodedData.substr(this.offset, 4), 4);
        this.offset = this.offset + 4;
        return res;
      };

      this.readBYTE = function () {
        let res = convertDataToUInt(this.decodedData.substr(this.offset, 1), 1);
        this.offset = this.offset + 1;
        return res;
      };

      this.readWORD = function () {
        let res = convertDataToUInt(this.decodedData.substr(this.offset, 2), 2);
        this.offset = this.offset + 2;
        return res;
      };

      this.readDWORD = function () {
        let res = convertDataToUInt(this.decodedData.substr(this.offset, 4), 4);
        this.offset = this.offset + 4;
        return res;
      };

      this.readBOOL = function () {
        let res = this.decodedData.substr(this.offset, 1).charCodeAt(0);
        this.offset = this.offset + 1;
        return res;
      };

      this.readString = function (length) {
        if (isNaN(length)) {
          throw 'Parameter "length" has to be a valid number.';
        }

        let res = this.decodedData.substr(this.offset, length);
        this.offset = this.offset + length;
        return res;
      };

      this.readREAL = function () {
        let decData = [];
        decData[0] = convertDataToUInt(
          this.decodedData.substr(this.offset + 0, 1),
          1,
        );
        decData[1] = convertDataToUInt(
          this.decodedData.substr(this.offset + 1, 1),
          1,
        );
        decData[2] = convertDataToUInt(
          this.decodedData.substr(this.offset + 2, 1),
          1,
        );
        decData[3] = convertDataToUInt(
          this.decodedData.substr(this.offset + 3, 1),
          1,
        );

        let binData = [];
        binData[0] = dec2Binary(decData[0]);
        binData[1] = dec2Binary(decData[1]);
        binData[2] = dec2Binary(decData[2]);
        binData[3] = dec2Binary(decData[3]);

        let binStr = binData[3] + binData[2] + binData[1] + binData[0];

        let res = binary2Real(
          binStr,
          TcAdsWebService.TcAdsWebServiceDataTypes.REAL,
        );
        this.offset = this.offset + 4;
        return res;
      };

      this.readLREAL = function () {
        let decData = [];
        decData[0] = convertDataToUInt(
          this.decodedData.substr(this.offset + 0, 1),
          1,
        );
        decData[1] = convertDataToUInt(
          this.decodedData.substr(this.offset + 1, 1),
          1,
        );
        decData[2] = convertDataToUInt(
          this.decodedData.substr(this.offset + 2, 1),
          1,
        );
        decData[3] = convertDataToUInt(
          this.decodedData.substr(this.offset + 3, 1),
          1,
        );
        decData[4] = convertDataToUInt(
          this.decodedData.substr(this.offset + 4, 1),
          1,
        );
        decData[5] = convertDataToUInt(
          this.decodedData.substr(this.offset + 5, 1),
          1,
        );
        decData[6] = convertDataToUInt(
          this.decodedData.substr(this.offset + 6, 1),
          1,
        );
        decData[7] = convertDataToUInt(
          this.decodedData.substr(this.offset + 7, 1),
          1,
        );

        let binData = [];
        binData[0] = dec2Binary(decData[0]);
        binData[1] = dec2Binary(decData[1]);
        binData[2] = dec2Binary(decData[2]);
        binData[3] = dec2Binary(decData[3]);
        binData[4] = dec2Binary(decData[4]);
        binData[5] = dec2Binary(decData[5]);
        binData[6] = dec2Binary(decData[6]);
        binData[7] = dec2Binary(decData[7]);

        let binStr =
          binData[7] +
          binData[6] +
          binData[5] +
          binData[4] +
          binData[3] +
          binData[2] +
          binData[1] +
          binData[0];

        let res = binary2Real(
          binStr,
          TcAdsWebService.TcAdsWebServiceDataTypes.LREAL,
        );
        this.offset = this.offset + 8;
        return res;
      };
    };

    this.DataWriter = function () {
      this.getTypeString = function () {
        return 'TcAdsWebService.DataWriter';
      };

      this.getBase64EncodedData = function () {
        return Base64.encode(byteArrayToBinaryString(byteArray));
      };

      this.writeSINT = function (value) {
        byteArray = PrepareData(
          value,
          TcAdsWebService.TcAdsWebServiceDataTypes.Integer,
          1,
          byteArray,
        );
      };

      this.writeINT = function (value) {
        byteArray = PrepareData(
          value,
          TcAdsWebService.TcAdsWebServiceDataTypes.Integer,
          2,
          byteArray,
        );
      };

      this.writeDINT = function (value) {
        byteArray = PrepareData(
          value,
          TcAdsWebService.TcAdsWebServiceDataTypes.Integer,
          4,
          byteArray,
        );
      };

      this.writeBYTE = function (value) {
        byteArray = PrepareData(
          value,
          TcAdsWebService.TcAdsWebServiceDataTypes.UnsignedInteger,
          1,
          byteArray,
        );
      };

      this.writeWORD = function (value) {
        byteArray = PrepareData(
          value,
          TcAdsWebService.TcAdsWebServiceDataTypes.UnsignedInteger,
          2,
          byteArray,
        );
      };

      this.writeDWORD = function (value) {
        byteArray = PrepareData(
          value,
          TcAdsWebService.TcAdsWebServiceDataTypes.UnsignedInteger,
          4,
          byteArray,
        );
      };

      this.writeBOOL = function (value) {
        byteArray = PrepareData(
          value,
          TcAdsWebService.TcAdsWebServiceDataTypes.BOOL,
          1,
          byteArray,
        );
      };

      this.writeString = function (value, length) {
        byteArray = PrepareData(
          value,
          TcAdsWebService.TcAdsWebServiceDataTypes.String,
          length,
          byteArray,
        );
      };

      this.writeREAL = function (value) {
        byteArray = PrepareData(
          value,
          TcAdsWebService.TcAdsWebServiceDataTypes.REAL,
          4,
          byteArray,
        );
      };

      this.writeLREAL = function (value) {
        byteArray = PrepareData(
          value,
          TcAdsWebService.TcAdsWebServiceDataTypes.LREAL,
          8,
          byteArray,
        );
      };

      let byteArray = [];

      let PrepareData = function (data, type, len, array) {
        let j = array.length;

        if (type == TcAdsWebService.TcAdsWebServiceDataTypes.String) {
          let k;

          for (k = 0; k < data.length; k++) {
            array[j++] = data.charCodeAt(k);
          }

          for (; k < len; k++) {
            array[j++] = 0;
          }
        } else if (type == TcAdsWebService.TcAdsWebServiceDataTypes.BOOL) {
          array[j++] = data;
        } else if (
          type == TcAdsWebService.TcAdsWebServiceDataTypes.Integer ||
          type == TcAdsWebService.TcAdsWebServiceDataTypes.UnsignedInteger
        ) {
          if (len == 1) {
            array[j++] = ToByte(parseInt(data >> 0, 10));
          } else if (len == 2) {
            data = parseInt(data);
            array[j++] = ToByte(parseInt(data >> 0, 10));
            array[j++] = ToByte(parseInt(data >> 8, 10));
          } else if (len == 4) {
            data = parseInt(data);

            if (isNaN(data)) data = 0;

            array[j++] = ToByte(parseInt(data >> 0, 10));
            array[j++] = ToByte(parseInt(data >> 8, 10));
            array[j++] = ToByte(parseInt(data >> 16, 10));
            array[j++] = ToByte(parseInt(data >> 24, 10));
          }
        } else if (type == TcAdsWebService.TcAdsWebServiceDataTypes.REAL) {
          let binary = real2Binary(data, type);

          let subBytes = [];
          subBytes[0] = binary.substring(0, 8);
          subBytes[1] = binary.substring(8, 16);
          subBytes[2] = binary.substring(16, 24);
          subBytes[3] = binary.substring(24, 32);

          array[j++] = binary2Dec(subBytes[3]);
          array[j++] = binary2Dec(subBytes[2]);
          array[j++] = binary2Dec(subBytes[1]);
          array[j++] = binary2Dec(subBytes[0]);
        } else if (type == TcAdsWebService.TcAdsWebServiceDataTypes.LREAL) {
          let binary = real2Binary(data, type);

          let subBytes = [];
          subBytes[0] = binary.substring(0, 8);
          subBytes[1] = binary.substring(8, 16);
          subBytes[2] = binary.substring(16, 24);
          subBytes[3] = binary.substring(24, 32);

          subBytes[4] = binary.substring(32, 40);
          subBytes[5] = binary.substring(40, 48);
          subBytes[6] = binary.substring(48, 56);
          subBytes[7] = binary.substring(56, 64);

          array[j++] = binary2Dec(subBytes[7]);
          array[j++] = binary2Dec(subBytes[6]);
          array[j++] = binary2Dec(subBytes[5]);
          array[j++] = binary2Dec(subBytes[4]);
          array[j++] = binary2Dec(subBytes[3]);
          array[j++] = binary2Dec(subBytes[2]);
          array[j++] = binary2Dec(subBytes[1]);
          array[j++] = binary2Dec(subBytes[0]);
        }

        return array;
      };
    };

    this.TcAdsReservedIndexGroups = {
      PlcRWMX: 16416,
      PlcRWMB: 16416,
      PlcRWRB: 16432,
      PlcRWDB: 16448,
      SymbolTable: 61440,
      SymbolName: 61441,
      SymbolValue: 61442,
      SymbolHandleByName: 61443,
      SymbolValueByName: 61444,
      SymbolValueByHandle: 61445,
      SymbolReleaseHandle: 61446,
      SymbolInfoByName: 61447,
      SymbolVersion: 61448,
      SymbolInfoByNameEx: 61449,
      SymbolDownload: 61450,
      SymbolUpload: 61451,
      SymbolUploadInfo: 61452,
      SymbolNote: 61456,
      IOImageRWIB: 61472,
      IOImageRWIX: 61473,
      IOImageRWOB: 61488,
      IOImageRWOX: 61489,
      IOImageClearI: 61504,
      IOImageClearO: 61520,
      DeviceData: 61696,
    };

    this.TcAdsWebServiceDataTypes = {
      String: 0,
      BOOL: 1,
      Integer: 2,
      UnsignedInteger: 3,
      LREAL: 4,
      REAL: 5,
    };

    this.AdsState = {
      INVALID: 0,
      IDLE: 1,
      RESET: 2,
      INIT: 3,
      START: 4,
      RUN: 5,
      STOP: 6,
      SAVECFG: 7,
      LOADCFG: 8,
      POWERFAILURE: 9,
      POWERGOOD: 10,
      ERROR: 11,
      SHUTDOWN: 12,
      SUSPEND: 13,
      RESUME: 14,
      CONFIG: 15,
      RECONFIG: 16,
    };

    let byteArrayToBinaryString = function (arr) {
      let res = '';
      for (let i = 0; i < arr.length; i++) {
        res += String.fromCharCode(arr[i] & 0xff);
      }
      return res;
    };

    let Base64 = (function () {
      let encode = function (data) {
        let out = '',
          c1,
          c2,
          c3,
          e1,
          e2,
          e3,
          e4;
        for (let i = 0; i < data.length; ) {
          c1 = data.charCodeAt(i++);
          c2 = data.charCodeAt(i++);
          c3 = data.charCodeAt(i++);
          e1 = c1 >> 2;
          e2 = ((c1 & 3) << 4) + (c2 >> 4);
          e3 = ((c2 & 15) << 2) + (c3 >> 6);
          e4 = c3 & 63;
          if (isNaN(c2)) e3 = e4 = 64;
          else if (isNaN(c3)) e4 = 64;
          out +=
            tab.charAt(e1) + tab.charAt(e2) + tab.charAt(e3) + tab.charAt(e4);
        }
        return out;
      };

      let decode = function (data) {
        let out = '',
          c1,
          c2,
          c3,
          e1,
          e2,
          e3,
          e4;
        for (let i = 0; i < data.length; ) {
          e1 = tab.indexOf(data.charAt(i++));
          e2 = tab.indexOf(data.charAt(i++));
          e3 = tab.indexOf(data.charAt(i++));
          e4 = tab.indexOf(data.charAt(i++));
          c1 = (e1 << 2) + (e2 >> 4);
          c2 = ((e2 & 15) << 4) + (e3 >> 2);
          c3 = ((e3 & 3) << 6) + e4;
          out += String.fromCharCode(c1);
          if (e3 != 64) out += String.fromCharCode(c2);
          if (e4 != 64) out += String.fromCharCode(c3);
        }
        return out;
      };

      let tab =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      return { encode: encode, decode: decode };
    })();

    let real2Binary = function (value, type) {
      let exp = 0,
        man = 0,
        bias = 0;

      switch (type) {
        case TcAdsWebService.TcAdsWebServiceDataTypes.LREAL:
          exp = 11;
          man = 52;
          bias = 1023;
          break;

        case TcAdsWebService.TcAdsWebServiceDataTypes.REAL:
        default:
          exp = 8;
          man = 23;
          bias = 127;
      }

      let sign = value >= 0.0 ? 0 : 1;

      let n = 0,
        power,
        sign2;
      if (value > 0 || value < 0) {
        if (value < 2 && value > -2) sign2 = -1;
        else sign2 = 1;

        for (power = 0; n < 1 || n > 2; ++power) {
          n = (Math.pow(-1, sign) * value) / Math.pow(2, sign2 * power);
        }
        power--;
      } else {
        power = bias;
        sign2 = -1;
      }

      let exponent = bias + sign2 * power;
      exponent = exponent.toString(2);

      for (let i = exponent.length; i < exp; i++) {
        exponent = '0' + exponent;
      }

      let n2 = 0,
        temp = 0,
        fraction = '';
      n = n - 1;
      for (let i = 1; i < man + 1; i++) {
        temp = n2 + 1 / Math.pow(2, i);
        if (temp <= n) {
          n2 = temp;
          fraction += '1';
        } else fraction += '0';
      }

      let res = sign + exponent + fraction;
      return res;
    };

    let binary2Real = function (binary, type) {
      let neg,
        nullE = true,
        nullF = true,
        oneE = true,
        strE = '',
        x = 0,
        exp,
        man,
        bias;

      if (binary.charAt(0) == 0) neg = false;
      else neg = true;

      switch (type) {
        case TcAdsWebService.TcAdsWebServiceDataTypes.LREAL:
          exp = 11;
          man = 52;
          bias = 1023;
          break;

        case TcAdsWebService.TcAdsWebServiceDataTypes.REAL:
        default:
          exp = 8;
          man = 23;
          bias = 127;
      }

      for (let i = 1; i <= exp; i++) {
        strE += binary.charAt(i);

        if (binary.charAt(i) != '0') nullE = false;

        if (binary.charAt(i) != '1') oneE = false;
      }

      let strF = '';

      for (let i = exp + 1; i <= exp + man; i++) {
        strF += binary.charAt(i);

        if (binary.charAt(i) != '0') nullF = false;
      }

      if (nullE && nullF) {
        //return ((!neg) ? "0" : "-0");
        // Return zero for negative and positive zero
        return 0.0;
      }

      if (oneE && nullF) return Infinity;

      if (oneE && nullF) return NaN;

      let exponent = binary2Dec(strE) - bias;

      let fraction = 0;

      for (let i = 0; i < strF.length; ++i) {
        fraction = fraction + parseInt(strF.charAt(i)) * Math.pow(2, -(i + 1));
      }

      fraction = fraction + 1;
      let ret =
        Math.pow(-1, binary.charAt(0)) * fraction * Math.pow(2, exponent);

      return ret;
    };

    let ToByte = function (v) {
      return parseInt(v, 10) & 255;
    };

    let dec2Binary = function (value) {
      let buf = '';
      let buf2 = '';
      let quotient = value;
      let i = 0;

      do {
        buf += Math.floor(quotient % 2) == 1 ? '1' : '0';
        quotient /= 2;
        i++;
      } while (i < 8);

      buf = buf.split('').reverse().join('');

      return buf;
    };

    let binary2Dec = function (binary) {
      let ret = 0;

      for (let i = 0; i < binary.length; ++i) {
        if (binary.charAt(i) == '1')
          ret = ret + Math.pow(2, binary.length - i - 1);
      }

      return ret;
    };

    let convertDataToUInt = function (data, len) {
      let res = 0;

      if (len == 4) {
        res =
          ((data.charCodeAt(3) << 24) |
            (data.charCodeAt(2) << 16) |
            (data.charCodeAt(1) << 8) |
            data.charCodeAt(0 + 0)) >>>
          0; // ">>> 0" = handle value as unsigned
      } else if (len == 2) {
        res = ((data.charCodeAt(1) << 8) | data.charCodeAt(0)) >>> 0; // ">>> 0" = handle value as unsigned
      } else if (len == 1) {
        res = data.charCodeAt(0) >>> 0; // ">>> 0" = handle value as unsigned
      }

      return res;
    };

    let convertDataToInt = function (data, len) {
      let res = 0;

      if (len == 4) {
        res =
          (data.charCodeAt(3) << 24) |
          (data.charCodeAt(2) << 16) |
          (data.charCodeAt(1) << 8) |
          data.charCodeAt(0);
      } else if (len == 2) {
        let cCode = (data.charCodeAt(1) << 8) | data.charCodeAt(0);
        let sign = cCode & 0x8000;
        if (sign == 0x8000) {
          // Byte 1 = 100000, Byte 0 = 000000
          //  Fill left 16 Bytes with 1
          cCode = cCode | 0xffff8000;
        } else {
          // Byte 1 = 000000, Byte 0 = 000000
          //  Fill left 16 Bytes with 0
          cCode = cCode & 0x7fff;
        }
        res = cCode;
      } else if (len == 1) {
        // JavaScript handles numbers always as 32 bit integer values;
        let cCode = data.charCodeAt(0);
        let sign = cCode & 0x80;
        if (sign == 0x80) {
          // byte_0 = 100000
          //  Fill left 24 Bytes with 1
          cCode = cCode | 0xffffff80;
        } else {
          // byte_0 = 000000
          //  Fill left 24 Bytes with 0
          cCode = cCode & 0x7f;
        }
        res = cCode;
      }

      return res;
    };
  })();
  ////////////////////////////////////////////////////
  // Expose TcAdsWebService instance to window object.
  window.TcAdsWebService = TcAdsWebService;
  ////////////////////////////////////////////////////
})(window);
////////////////////////////////////////////////////
