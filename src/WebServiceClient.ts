/*!
 * TAME [TwinCAT ADS Made Easy] V3.5
 *
 * Copyright (c) 2009-2015 Thomas Schmidt; t.schmidt.p1 at freenet.de
 *
 * Dual licensed under:
 *  MIT - http://www.opensource.org/licenses/mit-license
 *  GPLv3 - http://www.opensource.org/licenses/GFwPL-3.0
 *
 */

import { log } from './log.js';
import * as plc from './plc.js';
import {
  isValidStringLen,
  parseVarName,
  dataToByteArray,
  getTypeAndFormat,
} from './helper.js';
import { decodeBase64, encodeBase64 } from './b64.js';
import { subStringToData } from './decoder.js';

//import parse from 'xml-parser';

export type DescriptorArgs = {
  readLength: number;
  items: ItemTyp[];
  seq: boolean;
  calcAlignment: boolean;
  dataObj(
    jvar: string,
    data: string | number | boolean | Date | undefined,
    dataObj: any,
    prefix: string,
    suffix: string,
  ): unknown;
  strlen: number;
  format: string;
  decPlaces: number;
  dp: number;
  def: string;
  arrlen: number;
  item: number;
  val: number;
  jvar: string;
  prefix: string;
  suffix: string;
  addr: string;
  name: string;
  id: number;
  oc: number;
  ocd: number;
  debug: boolean;
  sync: boolean;
  offs: number;
};

export type AdsRequest = {
  adsReq: {};
  indexGroup: number;
  indexOffset: number;
  method: string;
  pData: string;
  pwrData: string;
  reqDescr: DescriptorArgs;
  send: () => void;
  sync: boolean;
  xmlHttpReq: XMLHttpRequest;
};

type ItemType = {
  prefix?: string;
  suffic?: string;
  def: any;
  name: string;
  type: string;
  format: string;
  decPlaces: number;
  dp: number;
  offs: number;
};

type ItemInfoType = {
  arrayDataType: string;
  arrayLength: number;
  bitOffset: number;
  dataType: string;
  dataTypeArrIdx: number[];
  dataTypeNames: string[];
  format: number | string;
  itemSize: number;
  offs: number;
  size: number;
  stringLength: number;
  symbolName: string;
  symbolNameArrIdx: number;
  type: string;
};

/*jslint plusplus: true, bitwise: true */

type Service = {
  alignment?: string | number;
  amsNetId: string;
  amsPort?: number;
  configFileUrl?: string;
  dataAlign4?: boolean;
  dontFetchSymbols: boolean;
  forceUploadUsage?: boolean | null;
  language?: string;
  servicePassword?: string | null;
  serviceUrl: string;
  serviceUser?: string | null;
  syncXmlHttp?: boolean;
};

export type Symbol = {
  arrayDataType: string;
  arrayLength: number;
  arrStartIdx: number;
  bitOffset: number;
  bitSize: string;
  dataType: string;
  fullType: string;
  indexGroup: number;
  indexOffset: number;
  itemSize: number;
  pointer: boolean;
  size: number;
  stringLength: number;
  type: string;
  typeString: string;
};

export class WebServiceClient {
  maxDropReq: number = 10;
  adsState: number | null = null;
  adsStateTxt: string = '';
  deviceState: number | null = null;
  //The Symbol Table for accessing variables per name.
  symTable: { [index: string]: Symbol } = {};
  symTableOk = false;
  dataTypeTable: {
    [index: string]: {
      size: number;
      bitSize: number;
      subItems: { [index: string]: Symbol };
    };
  } = {};
  dataTypeTableOk = false;
  //Array for the request acknowledgement counter.
  currReq = [0];
  serviceInfo = { alignment: 0, port: 0, netId };
  symbolCount = 0;
  alignment = 0;
  xmlHttpReq: any;

  /**
   * The constructor  for the Web Service Client.
   *
   * @param {Object} service  Contains the paramters of the Web Service.
   */
  constructor(private service: Service) {
    //======================================================================================
    //                                Check Client Parameter
    //======================================================================================

    //AMS NetID of the PLC
    if (
      typeof service.amsNetId !== 'string' &&
      (typeof service.configFileUrl !== 'string' ||
        service.dontFetchSymbols === true)
    ) {
      log(
        'TAME library error: NetId is not defined and there is no URL for fetching the TPY file or fetching the symbols is deactivated!',
      );
      return;
    }

    //AMS Port Number of the Runtime System
    if (
      service.amsPort === undefined &&
      (typeof service.configFileUrl !== 'string' ||
        service.dontFetchSymbols === true)
    ) {
      service.amsPort = 801;
      log(
        'TAME library warning: AMS port number is not set! Default port 801 will be used.',
      );
    }
    if ((service.amsPort ?? 0) < 801 || (service.amsPort ?? 0) > 891) {
      log(
        'TAME library error: AMS Port Number (' +
          service.amsPort +
          ') is out of range (801-891)!',
      );
      return;
    }

    //Data alignment, x86 and TC2 uses a 1 byte alignment, for an ARM and TC2 set it to 4 and
    //for TC3 generally to 8;
    //dataAlign4 is depricated
    if (service.dataAlign4 === true) {
      this.alignment = 4;
    } else if (
      service.alignment === undefined &&
      (typeof service.configFileUrl !== 'string' ||
        service.dontFetchSymbols === true)
    ) {
      this.alignment = 1;
    } else if (typeof service.alignment === 'string') {
      this.alignment = parseInt(service.alignment, 10);
    } else if (typeof service.alignment === 'number') {
      this.alignment = service.alignment;
    }

    //Global synchronous XMLHTTPRequests
    if (service.syncXmlHttp === true) {
      log(
        'TAME library info: The "syncXmlHttp" parameter was set. Synchronous XMLHttpRequests are used by default.',
      );
    }

    //Username/password
    if (
      typeof service.serviceUser === 'string' &&
      typeof service.servicePassword === 'string'
    ) {
      log(
        'TAME library info: Username and password set. Authenticated requests will be used.',
      );
    } else {
      service.serviceUser = null;
      service.servicePassword = null;
    }

    //======================================================================================
    //                                Initialize Properties
    //======================================================================================

    //Maximum string length.

    //Maximum count of dropped requests after a request
    //was not acknowledged (in conjunction with a reqest ID).

    //ADS states

    //----------------------------Test--------------------------------
    //log('TAME library info: Reading the PLC state ...');
    //this.readAdsState({sync:true});
    //log('TAME library info: Current PLC state: ' + this.adsStateTxt);
    //----------------------------Test--------------------------------

    /**
     * !!!!!INITIALIZATION OF THE SYMBOL TABLE!!!!!
     * !!!!!This  is called with instancing of the client.!!!!!
     *
     * Get the names of the PLC variables using the upload info.
     */
    if (service.dontFetchSymbols === true) {
      log(
        'TAME library info: Reading of the UploadInfo and the TPY file deactivated. Symbol Table could not be created.',
      );
    } else {
      if (typeof service.configFileUrl == 'string') {
        log('TAME library info: Fetching the TPY file from the webserver.');
        //Get the symbol file and parse it.
        this.getConfigFile();
      }

      this.setServiceParamFromTPY();

      if (
        typeof service.configFileUrl != 'string' ||
        service.forceUploadUsage === true
      ) {
        log('TAME library info: Start fetching the symbols from PLC.');
        //Get the UploadInfo.
        try {
          this.getUploadInfo();
        } catch (e) {
          log(
            "TAME library error: Could'nt fetch the symbol information from the PLC:" +
              e,
          );
          return;
        }
      }
    }
  }

  //======================================================================================
  //                                 Helper s
  //======================================================================================

  /**
   * The  returns the IndexGroup for a PLC variable address.
   *
   * @param {Object} req          An object with the address or the name for the request.
   * @return {Number} indexGroup  The IndexGroup for the ADS request.
   */
  getIndexGroup(req: {
    addr?: string;
    symbolName?: string;
  }): number | undefined {
    let indexGroup = -1;

    if (req.addr) {
      //Try to get the IndexGroup by address
      if (typeof req.addr === 'string' && req.addr.charAt(0) === '%') {
        if (req.addr.charAt(2) === 'X') {
          //Bit addresses.
          indexGroup = plc.indexGroups[req.addr.substr(1, 2)];
        } else {
          //Byte addresses.
          indexGroup = plc.indexGroups[req.addr.substr(1, 1)];
        }
      } else {
        log(
          'TAME library error: Wrong address definition, should be a string and start with "%"!',
        );
        log(req);
        return;
      }
    } else if (req.symbolName) {
      //Try to get the IndexGroup by name
      if (typeof req.symbolName === 'string') {
        try {
          indexGroup = this.symTable[req.symbolName].indexGroup;
        } catch (e) {
          log("TAME library error: Can't get the IndexGroup for this request!");
          log('TAME library error: Please check the variable name.');
          log(e);
          log(req);
          return;
        }
      } else {
        log('TAME library error: Varible name should be a string!');
        log(req);
        return;
      }
    } else {
      log(
        'TAME library error: Neither a name nor an address for the variable/request defined!',
      );
      log(req);
      return;
    }

    if (isNaN(indexGroup)) {
      log(
        'TAME library error: IndexGroup is not a number, check address or name definition of the variable/request!',
      );
      log(req);
    }

    return indexGroup;
  }

  /**
   * The  returns the IndexOffset for a PLC variable address.
   *
   * @param {Object} req          An object with the address or the name for the request.
   * @return {Number} indexOffset The IndexOffset for the ADS request.
   */
  getIndexOffset(req: {
    symbolNameArrIdx: any;
    addr?: string;
    symbolName?: string;
    addrOffset?: number;
    offs?: string;
    dataTypeNames: string[];
    dataTypeArrIdx: number[];
  }): number | undefined {
    let indexOffset;
    let numString = '';
    let mxaddr = [];
    let dataType;
    let itemArray;
    let subitem;

    if (req.addr) {
      //Try to get the IndexOffset by address
      if (typeof req.addr === 'string' && req.addr.charAt(0) === '%') {
        if (req.addr.charAt(2) === 'X') {
          //Bit req.addresses.
          numString = req.addr.substr(3);
          mxaddr = numString.split('.');
          indexOffset = parseInt(mxaddr[0], 10) * 8 + parseInt(mxaddr[1], 10);
        } else {
          //Byte addresses.
          indexOffset = parseInt(req.addr.substr(3), 10);
          //Address offset is used if only one item of an array
          //should be sent.
          if (typeof req.addrOffset === 'number') {
            indexOffset += req.addrOffset;
          }
        }
      } else {
        log(
          'TAME library error: Wrong address definition, should be a string and start with "%"!',
        );
        log(req);
        return;
      }
    } else if (req.symbolName) {
      //Try to get the IndexOffset by name.
      if (typeof req.symbolName === 'string') {
        try {
          //Get the offset from the symbol table
          indexOffset = this.symTable[req.symbolName].indexOffset;

          if (typeof req.symbolNameArrIdx === 'number') {
            indexOffset +=
              this.symTable[req.symbolName].itemSize *
              (req.symbolNameArrIdx -
                this.symTable[req.symbolName].arrStartIdx);
          }

          //Address offset is used if only one item of an array
          //should be sent.
          if (typeof req.addrOffset === 'number') {
            indexOffset += req.addrOffset;
          }
          //Add a manually defined bit offset.
          if (typeof req.offs === 'string') {
            indexOffset += parseInt(req.offs, 10) / 8;
          } else if (typeof req.offs === 'number') {
            indexOffset += req.offs / 8;
          }
          //Get the bit offset if a subitem is given.
          if (req.dataTypeNames.length > 0) {
            itemArray = req.dataTypeNames;
            dataType = this.symTable[req.symbolName].dataType;
            //Go through the array with the subitems and add the offsets
            for (let i = 0; i < itemArray.length; i++) {
              subitem = this.dataTypeTable[dataType].subItems[itemArray[i]];
              indexOffset += subitem.bitOffset / 8;
              //Calculate the offset.
              if (typeof req.dataTypeArrIdx[i] === 'number') {
                indexOffset +=
                  subitem.itemSize *
                  (req.dataTypeArrIdx[i] - subitem.arrStartIdx);
              }
              //Get the data type for the next round
              dataType =
                this.dataTypeTable[dataType].subItems[itemArray[i]].dataType;
            }
          }
        } catch (e) {
          log(
            "TAME library error: Can't get the IndexOffset for this request!",
          );
          log(
            'TAME library error: Please check the variable definition (name/offs/subitem).',
          );
          log(e);
          log(req);
          return;
        }
      } else {
        log('TAME library error: Varible name should be a string!');
        log(req);
        return;
      }
    } else {
      log(
        'TAME library error: Neither a name nor an address for the variable/request defined!',
      );
      log(req);
      return;
    }

    if (isNaN(indexOffset)) {
      log(
        'TAME library error: IndexOffset is not a number, check address or name definition of the variable/request.',
      );
      log(req);
    }

    return indexOffset;
  }

  /**
   * The  parses the PLC variable name, looks in the symbol and data type table and
   * returns an object with the necessary information.
   *
   * @param {Object} item          An object with at least the address or the name for the request.
   * @return {Objecct} itemInfo    An object with the information about the item.
   *
   */
  getItemInformation(item: ItemType) {
    const itemInfo: ItemInfoType = {
      arrayDataType: '',
      arrayLength: 0,
      bitOffset: 0,
      dataType: '',
      dataTypeArrIdx: [],
      dataTypeNames: [],
      format: '',
      itemSize: 0,
      offs: 0,
      size: 0,
      stringLength: 0,
      symbolName: '',
      symbolNameArrIdx: 0,
      type: '',
    };

    let arrPlcVarName;
    let splitType;

    if (typeof item.name === 'string') {
      item.name = item.name.toUpperCase();
      arrPlcVarName = item.name.split('.');
    } else {
      //Return if no symbol name is given
      return;
    }

    //Get the symbol name.
    if (arrPlcVarName[0] === '') {
      //Global variable
      itemInfo.symbolName = '.' + arrPlcVarName[1];
    } else {
      //Variable of an instance
      itemInfo.symbolName = arrPlcVarName[0] + '.' + arrPlcVarName[1];
    }
    //Cut an array index
    if (itemInfo.symbolName.charAt(itemInfo.symbolName.length - 1) === ']') {
      //Cut the array index and store it
      splitType = itemInfo.symbolName
        .substring(0, itemInfo.symbolName.length - 1)
        .split('[');
      itemInfo.symbolName = splitType[0];
      itemInfo.symbolNameArrIdx = parseInt(splitType[1], 10);
    }

    //Leave the rest as an array and add it to the itemInfo
    itemInfo.dataTypeNames = arrPlcVarName.slice(2);

    let arr = [],
      typeArray,
      dataType,
      i;

    if (typeof item.type === 'string') {
      //Type is defined by user
      arr = item.type.split('.');
      itemInfo.type = arr[0];
      if (arr.length > 2) {
        //Join the formatting string if there were points in it.
        arr[1] = arr.slice(1).join('.');
      }
      itemInfo.format = arr[1];
      itemInfo.size = plc.plcTypeLen[item.type];
    }

    if (
      this.symTableOk &&
      this.dataTypeTableOk &&
      itemInfo.dataTypeNames.length > 0
    ) {
      //Try to get the subitem type from the symbol table / data type table
      typeArray = itemInfo.dataTypeNames;
      dataType = this.symTable[itemInfo.symbolName].dataType;
      itemInfo.dataTypeArrIdx = [];
      //Go for the last subitem
      i = 0;

      do {
        //Check if the subitem is an array
        if (typeArray[i].charAt(typeArray[i].length - 1) === ']') {
          //Cut the array index and store it in an extra array
          splitType = typeArray[i]
            .substring(0, typeArray[i].length - 1)
            .split('[');
          typeArray[i] = splitType[0];
          itemInfo.dataTypeArrIdx[i] = parseInt(splitType[1], 10);
        }

        if (
          this.dataTypeTable[dataType].subItems[typeArray[i]].pointer === true
        ) {
          log(
            'TAME library error: PLC variable ' +
              [typeArray[i]] +
              " is a pointer! Can't get the variable value.",
          );
        }

        //Get the type of the next subitem
        if (i === typeArray.length - 1) {
          break;
        }
        dataType = this.dataTypeTable[dataType].subItems[typeArray[i]].dataType;
        i++;
      } while (i < typeArray.length);

      //Get the type of the subitem
      try {
        if (item.type === undefined) {
          itemInfo.type =
            this.dataTypeTable[dataType].subItems[typeArray[i]].type;
        }

        itemInfo.arrayLength =
          this.dataTypeTable[dataType].subItems[typeArray[i]].arrayLength;
        itemInfo.arrayDataType =
          this.dataTypeTable[dataType].subItems[typeArray[i]].arrayDataType;
        itemInfo.dataType =
          this.dataTypeTable[dataType].subItems[typeArray[i]].dataType;
        itemInfo.itemSize =
          this.dataTypeTable[dataType].subItems[typeArray[i]].itemSize;

        if (itemInfo.size === undefined) {
          itemInfo.size =
            this.dataTypeTable[dataType].subItems[typeArray[i]].size;
        }

        itemInfo.bitOffset =
          this.dataTypeTable[dataType].subItems[typeArray[i]].bitOffset;
        itemInfo.offs = item.offs;

        if (itemInfo.type === 'STRING' || itemInfo.arrayDataType === 'STRING') {
          itemInfo.stringLength =
            this.dataTypeTable[dataType].subItems[typeArray[i]].stringLength;
          itemInfo.format = itemInfo.stringLength; //compatibility
        } else if (typeof item.format === 'string') {
          itemInfo.format = item.format;
        } else if (typeof item.decPlaces === 'number') {
          itemInfo.format = item.decPlaces;
        } else if (typeof item.dp === 'number') {
          itemInfo.format = item.dp;
        }

        if (
          itemInfo.dataTypeArrIdx[i] !== undefined &&
          itemInfo.type === 'ARRAY'
        ) {
          itemInfo.type =
            this.dataTypeTable[dataType].subItems[typeArray[i]].arrayDataType;
          itemInfo.size =
            this.dataTypeTable[dataType].subItems[typeArray[i]].itemSize;
        }
      } catch (e) {
        log(
          'TAME library error: A problem occured while reading a data type from the data type table!',
        );
        log(e);
        log(item);
      }
    } else if (this.symTableOk) {
      //Try to get the type from the symbol table
      try {
        if (item.type === undefined) {
          itemInfo.type = this.symTable[itemInfo.symbolName].type;
        }

        itemInfo.arrayLength = this.symTable[itemInfo.symbolName].arrayLength;
        itemInfo.arrayDataType =
          this.symTable[itemInfo.symbolName].arrayDataType;
        itemInfo.dataType = this.symTable[itemInfo.symbolName].dataType;
        itemInfo.itemSize = this.symTable[itemInfo.symbolName].itemSize;

        if (itemInfo.size === undefined) {
          itemInfo.size = this.symTable[itemInfo.symbolName].size;
        }

        itemInfo.bitOffset = this.symTable[itemInfo.symbolName].bitOffset;
        itemInfo.offs = item.offs;

        if (itemInfo.type === 'STRING' || itemInfo.arrayDataType === 'STRING') {
          itemInfo.stringLength =
            this.symTable[itemInfo.symbolName].stringLength;
          itemInfo.format = itemInfo.stringLength; //compatibility
        } else if (typeof item.format === 'string') {
          itemInfo.format = item.format;
        } else if (typeof item.decPlaces === 'number') {
          itemInfo.format = item.decPlaces;
        } else if (typeof item.dp === 'number') {
          itemInfo.format = item.dp;
        }

        if (
          itemInfo.symbolNameArrIdx !== undefined &&
          itemInfo.type === 'ARRAY'
        ) {
          itemInfo.type = this.symTable[itemInfo.symbolName].arrayDataType;
          itemInfo.size = this.symTable[itemInfo.symbolName].itemSize;
        }
      } catch (e) {
        log(
          'TAME library error: A problem occured while reading a data type from the symbol table!',
        );
        log(e);
        log(item);
      }
    } else {
      log('TAME library error: Could not get the type of the item!');
      log(item);
    }
    return itemInfo;
  }

  /**
   * Create the objects for SOAP and XMLHttpRequest and send the request.
   *
   * @param {Object} adsReq   The object containing the arguments of the ADS request.
   */
  createRequest(adsReq: AdsRequest) {
    if (adsReq.reqDescr === undefined) {
      adsReq.reqDescr = {};
    } else if (adsReq.reqDescr.debug) {
      log(adsReq);
    }

    adsReq.send = () => {
      let soapReq;

      //Cancel the request, if the last on with the same ID is not finished.
      if (
        typeof adsReq.reqDescr.id === 'number' &&
        this.currReq[adsReq.reqDescr.id] > 0
      ) {
        log(
          'TAME library warning: Request dropped (last request with ID ' +
            adsReq.reqDescr.id +
            ' not finished!)',
        );
        this.currReq[adsReq.reqDescr.id]++;
        if (this.currReq[adsReq.reqDescr.id] <= this.maxDropReq) {
          return;
        }
        //Automatic acknowleding after a count of 'maxDropReq' to
        //prevent stucking.
        this.currReq[adsReq.reqDescr.id] = 0;
      }

      //Create the XMLHttpRequest object.
      this.xmlHttpReq = createXMLHttpReq();

      //Generate the SOAP request.
      soapReq = "<?xml version='1.0' encoding='utf-8'?>";
      soapReq +=
        "<soap:Envelope xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' ";
      soapReq += "xmlns:xsd='http://www.w3.org/2001/XMLSchema' ";
      soapReq += "xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'>";
      soapReq += '<soap:Body><q1:';
      soapReq += adsReq.method;
      soapReq +=
        " xmlns:q1='http://beckhoff.org/message/'><netId xsi:type='xsd:string'>";
      soapReq += this.service.amsNetId;
      soapReq += "</netId><nPort xsi:type='xsd:int'>";
      soapReq += this.service.amsPort;
      soapReq += '</nPort>';

      if (adsReq.indexGroup !== undefined) {
        soapReq += "<indexGroup xsi:type='xsd:unsignedInt'>";
        soapReq += adsReq.indexGroup;
        soapReq += '</indexGroup>';
      }
      if (adsReq.indexOffset !== undefined) {
        soapReq += "<indexOffset xsi:type='xsd:unsignedInt'>";
        soapReq += adsReq.indexOffset;
        soapReq += '</indexOffset>';
      }
      if (
        (adsReq.method === 'Read' || adsReq.method === 'ReadWrite') &&
        adsReq.reqDescr.readLength > 0
      ) {
        soapReq += "<cbRdLen xsi:type='xsd:int'>";
        soapReq += adsReq.reqDescr.readLength;
        soapReq += '</cbRdLen>';
      }
      if (adsReq.pData && adsReq.pData.length > 0) {
        soapReq += "<pData xsi:type='xsd:base64Binary'>";
        soapReq += adsReq.pData;
        soapReq += '</pData>';
      }
      if (adsReq.pwrData && adsReq.pwrData.length > 0) {
        soapReq += "<pwrData xsi:type='xsd:base64Binary'>";
        soapReq += adsReq.pwrData;
        soapReq += '</pwrData>';
      }
      soapReq += '</q1:';
      soapReq += adsReq.method;
      soapReq += '></soap:Body></soap:Envelope>';

      fetch({
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction: 'http://beckhoff.org/action/TcAdsSync.' + adsReq.method,
        },
        method: 'POST',
        body: soapReq,
        url: this.service.serviceUrl,
      })
        .then((response) => {
          return response.text();
        })
        .then((data) => {
          console.log(data);
          adsReq.xmlHttpReq.responseText = data;
          this.parseResponse(adsReq);
        });

      // //Send the AJAX request.
      // if (typeof this.xmlHttpReq === 'object') {

      //     this.xmlHttpReq.open('POST', service.serviceUrl, async, service.serviceUser, service.servicePassword);

      //     this.xmlHttpReq.setRequestHeader('SOAPAction', 'http://beckhoff.org/action/TcAdsSync.' + this.method);
      //     this.xmlHttpReq.setRequestHeader('Content-Type', 'text/xml; charset=utf-8');

      //     if (async === true) {
      //         //asynchronous request
      //         this.xmlHttpReq.onreadystatechange = () {
      //             if ((adsReq.xmlHttpReq.readyState === 4) && (adsReq.xmlHttpReq.status === 200)) {
      //                 this.parseResponse(adsReq);
      //             }
      //         };
      //         this.xmlHttpReq.send(soapReq);
      //     } else {
      //         //synchronous request
      //         this.xmlHttpReq.send(soapReq);
      //         this.parseResponse(adsReq);
      //     }

      //     //Request with index 'id' sent.
      //     if (typeof this.reqDescr.id === 'number') {
      //         currReq[this.reqDescr.id] = 1;
      //     }
      // }
    };
    return adsReq;
  }

  /**
   * Create a structure definition based on the information in the data table.
   *
   * @param {String}  structname  The name of the structure in the data table.
   * @return {Object} struct      An object containing the items of the structure.
   */

  createStructDef(structname: string) {
    const struct: { [index: string]: string } = {};
    let subitem;

    const subitems = this.dataTypeTable[structname].subItems;

    for (subitem in subitems) {
      if (subitems[subitem].type === 'USER') {
        //Creating a nested structue definition works, but parsing doesn't
        log(
          'TAME library error: Automatic creating of nested structures is not supported (yet)!',
        );
        struct[subitem] = this.createStructDef(subitems[subitem].dataType);
      } else {
        if (subitems.hasOwnProperty(subitem)) {
          struct[subitem] = subitems[subitem].fullType;
        }
      }
    }
    return struct;
  }

  //======================================================================================
  //                                  Encoder s
  //======================================================================================

  /**
   * Decode the response string of a Read Request and store the data.
   *
   * @param {Object} adsReq   ADS Reqest Object
   */
  parseReadReq(adsReq: AdsRequest): void {
    const itemList = adsReq.reqDescr.items;
    let response,
      arrType = [],
      strAddr = 0,
      item,
      dataString,
      dataSubString,
      data,
      strlen,
      len,
      plen,
      mod,
      type,
      format,
      startaddr;

    try {
      response = adsReq.xmlHttpReq.responseXML.documentElement;
      dataString = decodeBase64(
        response.getElementsByTagName('ppData')[0].firstChild.data,
      );

      //Run through the elements in the item list.
      for (let idx = 0, listlen = itemList.length; idx < listlen; idx++) {
        item = itemList[idx];

        //Get type and formatting string.
        arrType = getTypeAndFormat(item);
        type = arrType[0];
        format = arrType[1];

        //Get the length of the data types.
        len = plc.plcTypeLen[type];

        switch (type) {
          case 'STRING':
            if (format !== undefined) {
              strlen = parseInt(format, 10);
            }
            len = (isValidStringLen(strlen) ? strlen : len) + 1;
            break;
          case 'EndStruct':
            //Set the length of the padding bytes at the end of the structure
            //"EndStruct" is only used with "readArrayOfStructures/writeArrayOfStructures".
            len = item.val;
            break;
        }

        //Set the length for calculating padding bytes
        plen = len < this.alignment ? len : alignment;

        //Calculate the place of the element in the data string
        if (adsReq.reqDescr.seq !== true) {
          //If variable addresses are used.
          startaddr = getIndexOffset(adsReq.reqDescr);
          strAddr = item.addr - startaddr;
        } else if (
          adsReq.reqDescr.calcAlignment === true &&
          plen > 1 &&
          type !== 'EndStruct' &&
          type !== 'STRING' &&
          strAddr > 0
        ) {
          //Compute the address for the alignment in case of a structure.
          mod = strAddr % plen;
          if (mod > 0) {
            strAddr += plen - mod;
          }
        }

        //Slice the string and decode the data
        dataSubString = dataString.substr(strAddr, len);
        data = subStringToData(dataSubString, type, format);

        //Parse the name of the JavaScript variable and write the data to it
        if (type !== 'EndStruct') {
          parseVarName(
            item.jvar,
            data,
            adsReq.reqDescr.dataObj,
            item.prefix,
            item.suffix,
          );
        }

        //Set the next address
        if (adsReq.reqDescr.seq === true) {
          strAddr += len;
        }
      }
    } catch (e) {
      log('TAME library error: Parsing of Read Request failed:' + e);
      log(item);
      return;
    }
  }

  /**
   * Decode the response string of a SumReadRequest and store the data.
   *
   * @param {Object} adsReq   ADS Request Object
   */
  parseSumReadReq(adsReq: AdsRequest): void {
    let response,
      itemList = adsReq.reqDescr.items,
      strAddr = 0,
      subStrAddr = 0,
      dataObj = window,
      vlenMax = 0,
      item: ItemType = {},
      dataString,
      dataSubString = '',
      data,
      len = 0,
      type = '',
      format = '',
      listlen,
      errorCode,
      jvar = '';
    let i: number | null = null;
    let arrayLength;
    let itemSize;
    let itemInfo: ItemInfoType | undefined;

    /**
     * Slice a piece out of the substring, convert the data and write it
     * to the JavaScript variable.
     */
    const parseSubStringSlice = () => {
      let strlen = 0;

      if (type === 'STRING') {
        if (format !== undefined) {
          strlen = parseInt(format, 10);
        } else if (typeof itemInfo.stringLength === 'number') {
          strlen = itemInfo.stringLength;
        }
        len = (isValidStringLen(strlen) ? strlen : len) + 1;
      }

      //Take a piece of the data sub string
      const subStrSlice = dataSubString.substr(subStrAddr, len);
      //Convert the data
      data = subStringToData(subStrSlice, type, format);
      //Parse the name of the JavaScript variable and write the data to it
      parseVarName(jvar, data, dataObj, item.prefix, item.suffix);

      subStrAddr += len;
    };

    /**
     * Parse the stucture definition and compute the data of
     * the substring.
     */
    const parseStructure = () => {
      let j, defArr, lenArrElem, lastDefArr, mod, elem;

      /**
       *  for adjusting the address of the data in the string
       * if an alignment is used.
       */
      const checkAlignment = () => {
        let vlen, mod;

        if (this.alignment > 1 && type !== 'STRING' && type !== 'EndStruct') {
          //Set the length for calculating padding bytes
          vlen = len < this.alignment ? len : this.alignment;

          //Compute the address for the alignment.
          if (vlen > 1 && subStrAddr > 0) {
            mod = subStrAddr % vlen;
            if (mod > 0) {
              subStrAddr += vlen - mod;
            }
          }

          //Store the maximum length of the PLC variables
          //for inserting padding bytes at the end of the structure.
          if (vlen > vlenMax) {
            vlenMax = vlen;
          }
        }
      };

      //Check structure definition
      if (typeof item.def === 'string') {
        item.def = parseVarName(item.def);
      } else if (this.dataTypeTableOk === true && item.def === undefined) {
        item.def = this.createStructDef(itemInfo.dataType);
      } else if (typeof item.def !== 'object') {
        log('TAME library error: No structure defininition found!');
      }

      for (elem in item.def) {
        if (item.def.hasOwnProperty(elem)) {
          defArr = item.def[elem].split('.');
          if (defArr[0] === 'ARRAY') {
            lenArrElem = parseInt(defArr[1], 10);
            lastDefArr = defArr.length - 1;
            for (j = 0; j < lenArrElem; j++) {
              type = defArr[2];
              if (defArr[lastDefArr] === 'SP') {
                jvar = elem + j;
                if (lastDefArr >= 4) {
                  format = defArr.slice(3, -1).join('.');
                }
              } else {
                jvar = elem + '.' + j;
                if (lastDefArr >= 3) {
                  format = defArr.slice(3).join('.');
                }
              }
              //Add index in case of an array of struct
              if (i !== null) {
                jvar = i + '.' + jvar;
              }

              len = plc.plcTypeLen[type];
              checkAlignment();
              parseSubStringSlice();
            }
          } else {
            //Check if we are in an array of struct
            if (i !== null) {
              jvar = i + '.' + elem;
            } else {
              jvar = elem;
            }

            type = defArr[0];
            if (defArr.length > 2) {
              defArr[1] = defArr.slice(1).join('.');
            }
            format = defArr[1];
            len = plc.plcTypeLen[type];
            checkAlignment();
            parseSubStringSlice();
          }
        }
      }

      //Calculate the padding bytes at the end of the structure
      if (
        this.alignment > 1 &&
        vlenMax > 1 &&
        type !== 'STRING' &&
        type !== 'EndStruct'
      ) {
        if (vlenMax > this.alignment) {
          vlenMax = this.alignment;
        }
        mod = subStrAddr % vlenMax;
        if (mod > 0) {
          subStrAddr += vlenMax - mod;
        }
      }
    };

    try {
      response = adsReq.xmlHttpReq.responseXML.documentElement;
      dataString = decodeBase64(
        response.getElementsByTagName('ppRdData')[0].firstChild.data,
      );

      //Read the error codes of the ADS sub commands.
      for (let idx = 0, listlen = itemList.length; idx < listlen; idx++) {
        dataSubString = dataString.substr(strAddr, 4);
        errorCode = subStringToData(dataSubString, 'DWORD');

        if (errorCode !== 0) {
          log(
            'TAME library error: ADS sub command error while processing a SumReadRequest!',
          );
          log('Error code: ' + errorCode);
          log(itemList[idx]);
        }

        strAddr += 4;
      }

      //Run through the elements in the item list.
      for (let idx = 0; idx < listlen; idx++) {
        item = itemList[idx];

        itemInfo = this.getItemInformation(item);

        //Get type and formatting string.
        type = itemInfo.type;
        format = itemInfo.format;

        //Get the length of the data types.
        itemSize = itemInfo.size;

        //Reset counter for arrays.
        i = null;

        //Slice the string and decode the data
        dataSubString = dataString.substr(strAddr, itemSize);

        switch (type) {
          case 'ARRAY':
            dataObj = parseVarName(item.jvar);
            subStrAddr = 0;
            arrayLength = itemInfo.arrayLength;
            if (itemInfo.arrayDataType === 'USER') {
              for (let i = 0; i < arrayLength; i++) {
                parseStructure();
              }
            } else {
              type = itemInfo.arrayDataType;
              len = plc.plcTypeLen[type];
              for (let i = 0; i < arrayLength; i++) {
                jvar = i;
                parseSubStringSlice();
              }
            }
            break;
          case 'USER':
            dataObj = parseVarName(item.jvar);
            subStrAddr = 0;
            parseStructure();
            break;
          default:
            //Convert the data
            dataObj = window;
            data = subStringToData(dataSubString, type, format);
            //Parse the name of the JavaScript variable and write the data to it
            parseVarName(item.jvar, data, dataObj, item.prefix, item.suffix);
        }
        //Set the next string address
        strAddr += itemSize;
      }
    } catch (e) {
      log('TAME library error: Parsing of SumReadRequest failed:' + e);
      log(item);
      return;
    }
  }

  /**
   * Decode the response string of a SumWriteRequest.
   *
   * @param {Object} adsReq   ADS Request Object
   */
  parseSumWriteReq(adsReq: AdsRequest): void {
    let response,
      itemList = adsReq.reqDescr.items,
      strAddr = 0,
      item,
      dataString,
      dataSubString,
      data,
      listlen,
      errorCode;

    //Just look for errors.
    try {
      response = adsReq.xmlHttpReq.responseXML.documentElement;
      dataString = decodeBase64(
        response.getElementsByTagName('ppRdData')[0].firstChild.data,
      );

      //Read the error codes of the ADS sub commands.
      for (let idx = 0, listlen = itemList.length; idx < listlen; idx++) {
        dataSubString = dataString.substr(strAddr, 4);
        errorCode = subStringToData(dataSubString, 'DWORD');

        if (errorCode !== 0) {
          log(
            'TAME library error: ADS sub command error while processing a SumReadRequest!',
          );
          log('Error code: ' + errorCode);
          log(itemList[idx]);
        }
        strAddr += 4;
      }
    } catch (e) {
      log('TAME library error: Parsing of SumWriteRequest failed:' + e);
      log(item);
      return;
    }
  }

  /**
   * Decode the response string of a ADS State Request and store the data.
   *
   * @param {Object} adsReq   ADS Reqest Object
   */
  parseAdsState(adsReq: AdsRequest): void {
    let response;

    try {
      response = adsReq.xmlHttpReq.responseXML.documentElement;
      this.adsState = parseInt(
        response.getElementsByTagName('pAdsState')[0].firstChild.data,
        10,
      );
      this.adsStateTxt = plc.adsStates[this.adsState];
      this.deviceState = parseInt(
        response.getElementsByTagName('pDeviceState')[0].firstChild.data,
        10,
      );
    } catch (e) {
      log('TAME library error: Parsing of ADS Read State Request failed:' + e);
      return;
    }
  }

  //======================================================================================
  //                     s for Creating Request Descriptors
  //======================================================================================

  /**
   * Create the Request Descriptor for a single variable. An item list
   * with a single array item is generated.
   *
   * @param {String} method   The method, either "Read" or "Write".
   * @param {String} type     The PLC data type.
   * @param {Object} args     The arguments for building for the Request Descriptor.
   */
  createSingleDescriptor(method: string, type: string, args: DescriptorArgs) {
    let reqDescr = {};
    let arrSymType;
    let len;
    let itemInfo;

    itemInfo = this.getItemInformation(args);
    len = plc.plcTypeLen[type];

    switch (type) {
      case 'STRING':
        //Change the read length if a value is given.
        if (isValidStringLen(args.strlen)) {
          type += '.' + args.strlen;
          len = args.strlen;
        } else if (typeof itemInfo.stringLength === 'number') {
          len = itemInfo.stringLength;
          type += '.' + len;
        } else {
          log(
            'TAME library error: Could not get the length of the string for this request!',
          );
          log(args);
        }
        len++; //Termination
        break;
      case 'TIME':
      case 'TOD':
      case 'DT':
      case 'DATE':
      case 'DATE_AND_TIME':
      case 'TIME_OF_DAY':
        //Append the format string to the data type.
        if (typeof args.format === 'string') {
          type += '.' + args.format;
        }
        break;
      case 'REAL':
      case 'LREAL':
        //Append the number of decimal places to the data type.
        if (typeof args.decPlaces === 'number') {
          type += '.' + args.decPlaces;
        } else if (typeof args.dp === 'number') {
          type += '.' + args.dp;
        }
        break;
    }

    //Create the Request Descriptor.
    reqDescr = {
      addr: args.addr,
      //name: args.name,
      symbolName: itemInfo.symbolName,
      dataTypeNames: itemInfo.dataTypeNames,
      dataTypeArrIdx: itemInfo.dataTypeArrIdx,
      symbolNameArrIdx: itemInfo.symbolNameArrIdx,
      id: args.id,
      oc: args.oc,
      ocd: args.ocd,
      readLength: len,
      debug: args.debug,
      sync: args.sync,
      offs: args.offs,
      seq: true,
      items: [
        {
          val: args.val,
          jvar: args.jvar,
          type: type,
          prefix: args.prefix,
          suffix: args.suffix,
        },
      ],
    };

    //Call the send .
    if (method === 'Write') {
      this.writeReq(reqDescr);
    } else {
      this.readReq(reqDescr);
    }
  }

  /**
   * Create a Request Descriptor for an array. An item list of
   * single variables is generated.
   *
   * @param {String} method   The method, either "Read" or "Write".
   * @param {String} type     The data type of the PLC variable.
   * @param {Object} args     The arguments for building the Request Descriptor.
   */
  createArrayDescriptor(method: string, type: string, args: DescriptorArgs) {
    let reqDescr = {};
    let dataObj = {};
    let arrayLength = 0;
    let addrOffset;
    let cnt = 0;
    const i = 0;
    let j = 0;
    let len;
    let defArr = [];
    let lenArrElem;
    let lastDefArr;
    let structByteLen = 0;
    let strlen;
    let vlen;
    let vlenMax = 0;
    let endPadLen = 0;
    let mod;
    let addr;
    let wrtOneOnly;
    let arrSymType;
    let itemInfo: ItemInfoType;

    itemInfo = getItemInformation(args);

    //Get the object of the stored data, direct with 'val'
    //for a write request or parsing the name if 'jvar' is given.
    if (method === 'Write' && typeof args.val === 'object') {
      dataObj = args.val;
    } else if (typeof args.jvar === 'string') {
      dataObj = parseVarName(args.jvar);
    } else {
      log(
        'TAME library error: No data object for this ' +
          method +
          '-Request defined!',
      );
    }

    if (typeof args.arrlen === 'number') {
      //Override array length if manually set
      arrayLength = args.arrlen;
    } else if (itemInfo.arrayLength !== undefined) {
      //Get the array length from the symbol table.
      arrayLength = itemInfo.arrayLength;
    } else {
      log("TAME library error: Can't get the array length for this request!");
      log(args);
    }

    //Check if only one item should be written.
    if (
      typeof args.item === 'number' &&
      !isNaN(args.item) &&
      method === 'Write'
    ) {
      wrtOneOnly = true;
      if (args.item < 0 || args.item > arrayLength - 1) {
        log('TAME library error: Wrong value for "item"!');
        log('item: ' + args.item);
        log('Last array index: ' + (arrayLength - 1));
      }
    }

    /**
     *  for creating an descriptor for array of structures.
     */
    const createStructArr = () => {
      let elem;
      //Parse the name of the structure definiton, if it is passed
      //as a string.
      if (typeof args.def === 'string') {
        args.def = parseVarName(args.def);
      } else if (this.dataTypeTableOk === true && args.def === undefined) {
        args.def = this.createStructDef(itemInfo.dataType);
      } else if (typeof args.def !== 'object') {
        log('TAME library error: No structure definition found!');
      }

      //Calculate the length of the structure and the padding bytes
      for (elem in args.def) {
        if (args.def.hasOwnProperty(elem)) {
          //Separate data type and length.
          defArr = args.def[elem].split('.');

          if (defArr[0] === 'ARRAY') {
            lenArrElem = parseInt(defArr[1], 10);
            defArr.shift();
            defArr.shift();
          } else {
            lenArrElem = 1;
          }

          for (let i = 0; i < lenArrElem; i++) {
            //Set the length of the PLC variable.
            if (defArr[0] === 'STRING') {
              if (typeof defArr[1] === 'string') {
                strlen = parseInt(defArr[1], 10);
              }
              vlen =
                (isValidStringLen(strlen)
                  ? strlen
                  : plc.plcTypeLen[defArr[0]]) + 1;
            } else {
              vlen = plc.plcTypeLen[defArr[0]];
            }

            //Add the length of the PLC variables
            if (
              this.alignment > 1 &&
              vlen > 1 &&
              defArr[0] !== 'STRING' &&
              structByteLen > 0
            ) {
              mod = structByteLen % vlen;
              if (mod > 0) {
                structByteLen += vlen - mod;
              }
            }
            structByteLen += vlen;
          }
          //Store the maximum length of the PLC variables
          //for inserting padding bytes at the end of the structure.
          if (this.alignment > 1 && vlen > vlenMax && defArr[0] !== 'STRING') {
            vlenMax = vlen;
          }
        }
      }

      //Calculate the padding bytes at the end of the structure
      if (this.alignment > 1 && vlenMax > 1 && defArr[0] !== 'STRING') {
        if (vlenMax > alignment) {
          vlenMax = alignment;
        }
        mod = structByteLen % vlenMax;
        if (mod > 0) {
          endPadLen = vlenMax - mod;
          structByteLen += endPadLen;
        }
      }

      //Set the address offset and the length to 1
      //if only one item should be sent.
      if (wrtOneOnly) {
        addrOffset = structByteLen * args.item;
        arrayLength = 1;
      }

      reqDescr = {
        addr: args.addr,
        symbolName: itemInfo.symbolName,
        dataTypeNames: itemInfo.dataTypeNames,
        addrOffset: addrOffset,
        id: args.id,
        oc: args.oc,
        ocd: args.ocd,
        debug: args.debug,
        readLength: structByteLen * arrayLength,
        seq: true,
        calcAlignment: true,
        dataObj: dataObj,
        sync: args.sync,
        offs: args.offs,
        items: [],
      };

      //Create the item list.
      //Although jvar isn't necessary for write requests,
      //it's good for easier debugging.
      for (let i = 0; i < arrayLength; i++) {
        for (elem in args.def) {
          if (args.def.hasOwnProperty(elem)) {
            defArr = args.def[elem].split('.');

            if (defArr[0] === 'ARRAY') {
              lenArrElem = parseInt(defArr[1], 10);
              lastDefArr = defArr.length - 1;

              for (j = 0; j < lenArrElem; j++) {
                if (defArr[lastDefArr] === 'SP') {
                  reqDescr.items[cnt] = {
                    jvar: i + '.' + elem + j,
                  };
                  if (lastDefArr === 4) {
                    reqDescr.items[cnt].type = defArr[2] + '.' + defArr[3];
                  } else {
                    reqDescr.items[cnt].type = defArr[2];
                  }
                } else {
                  reqDescr.items[cnt] = {
                    jvar: i + '.' + elem + '.' + j,
                  };
                  if (lastDefArr === 3) {
                    reqDescr.items[cnt].type = defArr[2] + '.' + defArr[3];
                  } else {
                    reqDescr.items[cnt].type = defArr[2];
                  }
                }

                if (method === 'Write') {
                  if (wrtOneOnly) {
                    if (defArr[lastDefArr] === 'SP') {
                      reqDescr.items[cnt].val = dataObj[args.item][elem + j];
                    } else {
                      reqDescr.items[cnt].val = dataObj[args.item][elem][j];
                    }
                  } else {
                    if (defArr[lastDefArr] === 'SP') {
                      reqDescr.items[cnt].val = dataObj[i][elem + j];
                    } else {
                      reqDescr.items[cnt].val = dataObj[i][elem][j];
                    }
                  }
                }
                cnt++;
              }
            } else {
              reqDescr.items[cnt] = {
                jvar: i + '.' + elem,
                type: args.def[elem],
              };
              if (method === 'Write') {
                if (wrtOneOnly) {
                  reqDescr.items[cnt].val = dataObj[args.item][elem];
                } else {
                  reqDescr.items[cnt].val = dataObj[i][elem];
                }
              }
              cnt++;
            }
          }
        }
        //Set an item as a mark at the end of the structure
        //for inserting padding bytes in "writeReq" and "readReq" later.
        if (alignment > 1) {
          reqDescr.items[cnt] = {
            type: 'EndStruct',
            val: endPadLen,
          };
          cnt++;
        }
      }
    };

    /**
     *  for creating a descriptor for a simple array.
     */
    const createSimpleArr = () => {
      len = plc.plcTypeLen[type];

      switch (type) {
        case 'STRING':
          if (isValidStringLen(args.strlen)) {
            //Change the read length if a value is given.
            type += '.' + args.strlen;
            len = args.strlen;
          } else if (typeof itemInfo.stringLength === 'number') {
            len = itemInfo.stringLength;
            type += '.' + len;
          } else {
            log(
              'TAME library error: Could not get the length of the string for this request!',
            );
            log(args);
          }
          len++; //Termination
          break;
        case 'TIME':
        case 'TOD':
        case 'DT':
        case 'DATE':
        case 'DATE_AND_TIME':
        case 'TIME_OF_DAY':
          //Append the format string to the data type.
          if (typeof args.format === 'string') {
            type += '.' + args.format;
          }
          break;
        case 'REAL':
        case 'LREAL':
          //Append the number of decimal places to the data type.
          if (typeof args.decPlaces === 'number') {
            type += '.' + args.decPlaces;
          } else if (typeof args.dp === 'number') {
            type += '.' + args.dp;
          }
          break;
      }

      //Set the address offset and the length to 1
      //if only one item should be sent.
      if (wrtOneOnly) {
        addrOffset = args.item * len;
        arrayLength = 1;
      }

      reqDescr = {
        addr: args.addr,
        symbolName: itemInfo.symbolName,
        dataTypeNames: itemInfo.dataTypeNames,
        dataTypeArrIdx: itemInfo.dataTypeArrIdx,
        symbolNameArrIdx: itemInfo.symbolNameArrIdx,
        addrOffset: addrOffset,
        id: args.id,
        oc: args.oc,
        ocd: args.ocd,
        readLength: len * arrayLength,
        debug: args.debug,
        seq: true,
        dataObj: dataObj,
        items: [],
      };

      //Create the item list.
      //Although jvar isn't necessary for write requests,
      //it's good for easier debugging.
      for (let i = 0; i < arrayLength; i++) {
        reqDescr.items[i] = {
          jvar: i,
          type: type,
        };
        if (method === 'Write') {
          if (wrtOneOnly) {
            reqDescr.items[i].val = dataObj[args.item];
          } else {
            reqDescr.items[i].val = dataObj[i];
          }
        }
      }
    };

    if (type === 'STRUCT') {
      createStructArr();
    } else {
      createSimpleArr();
    }

    //Call the send .
    if (method === 'Write') {
      this.writeReq(reqDescr);
    } else {
      this.readReq(reqDescr);
    }
  }

  /**
   * Create a Request Descriptor for a structure,
   * a structure definition has to be passed as one of the arguments,
   * from wich the item list is created.
   *
   * @param {String} method   The method, either "Read" or "Write".
   * @param {Object} args     The arguments for building the Request Descriptor.
   */
  createStructDescriptor(method: string, args: unknown) {
    let reqDescr = {}, //Request Descriptor
      dataObj = {}, //object wich holds the data for write requests
      defArr = [], //subelements of a structure definition item
      cnt = 0,
      lastDefArr,
      lenArrElem,
      elem,
      j,
      itemInfo;

    itemInfo = getItemInformation(args);

    //Get the object of the stored data, direct with 'val'
    //for a write request or parsing the name if 'jvar' is given.
    if (method === 'Write' && typeof args.val === 'object') {
      dataObj = args.val;
    } else if (typeof args.jvar === 'string') {
      dataObj = parseVarName(args.jvar);
    } else {
      log(
        'TAME library error: No data object for this ' +
          method +
          '-Request defined!',
      );
    }

    //Parse the name of the structure definiton, if it is passed
    //as a string.
    if (typeof args.def === 'string') {
      args.def = parseVarName(args.def);
    } else if (this.dataTypeTableOk === true && args.def === undefined) {
      args.def = this.createStructDef(itemInfo.dataType);
    } else if (typeof args.def !== 'object') {
      log('TAME library error: No structure defininition found!');
    }

    reqDescr = {
      addr: args.addr,
      symbolName: itemInfo.symbolName,
      dataTypeNames: itemInfo.dataTypeNames,
      dataTypeArrIdx: itemInfo.dataTypeArrIdx,
      symbolNameArrIdx: itemInfo.symbolNameArrIdx,
      id: args.id,
      oc: args.oc,
      ocd: args.ocd,
      debug: args.debug,
      seq: true,
      calcAlignment: true,
      dataObj: dataObj,
      sync: args.sync,
      offs: args.offs,
      items: [],
    };

    //Create the item list.
    //Although jvar isn't necessary for write requests,
    //it's good for easier debugging.
    for (elem in args.def) {
      if (args.def.hasOwnProperty(elem)) {
        defArr = args.def[elem].split('.');

        if (defArr[0] === 'ARRAY') {
          lenArrElem = parseInt(defArr[1], 10);
          lastDefArr = defArr.length - 1;
          for (j = 0; j < lenArrElem; j++) {
            if (defArr[lastDefArr] === 'SP') {
              reqDescr.items[cnt] = {
                jvar: elem + j,
              };
              if (lastDefArr === 4) {
                reqDescr.items[cnt].type = defArr[2] + '.' + defArr[3];
              } else {
                reqDescr.items[cnt].type = defArr[2];
              }
            } else {
              reqDescr.items[cnt] = {
                jvar: elem + '.' + j,
              };
              if (lastDefArr === 3) {
                reqDescr.items[cnt].type = defArr[2] + '.' + defArr[3];
              } else {
                reqDescr.items[cnt].type = defArr[2];
              }
            }
            if (method === 'Write') {
              if (defArr[lastDefArr] === 'SP') {
                reqDescr.items[cnt].val = dataObj[elem + j];
              } else {
                reqDescr.items[cnt].val = dataObj[elem][j];
              }
            }
            cnt++;
          }
        } else {
          reqDescr.items[cnt] = {
            jvar: elem,
            type: args.def[elem],
          };
          if (method === 'Write') {
            reqDescr.items[cnt].val = dataObj[elem];
          }
          cnt++;
        }
      }
    }

    //Call the send
    if (method === 'Write') {
      this.writeReq(reqDescr);
    } else {
      this.readReq(reqDescr);
    }
  }

  //======================================================================================
  //                                Public Methods
  //======================================================================================

  /**
   * This is the  for creating a write request. Depending on the
   * values and PLC data types passed in the variable list a byte array is
   * created and the  for sending the request is called.
   *
   * @param {Object}  reqDescr    The Request Descriptor. Besides other information
   *                              this object contains the allocation of PLC and
   *                              JavaScript variables in an item list.
   */
  writeReq(reqDescr) {
    let itemList = reqDescr.items,
      adsReq = {},
      pData = [],
      arrType = [],
      bytes = [],
      type,
      format,
      len,
      pcount,
      mod,
      item,
      i;

    //Set the variable name to upper case.
    if (typeof reqDescr.name === 'string') {
      reqDescr.name = reqDescr.name.toUpperCase();
    }

    //Run through the elements in the item list.
    for (let idx = 0, listlen = itemList.length; idx < listlen; idx++) {
      item = itemList[idx];

      //Get type and formatting string.
      arrType = getTypeAndFormat(item);
      type = arrType[0];
      format = arrType[1];

      //Length of the data type.
      //Maximum lenght is limited to 4 (due to structure padding),
      //the lenght of strings is calculated later.
      if (isNaN(plc.plcTypeLen[type])) {
        log(
          'TAME library error: Could not get the length of the data type: ' +
            type,
        );
        log(
          'TAME library error: Probably wrong type definition. Please check the manual.',
        );
        log(reqDescr);
        return;
      }

      //Padding within structures.
      //"calcAlignment" is only set in "writeStruct/readStruct" and
      //"writeArrayOfStruct/readArrayOfStruct"
      len =
        plc.plcTypeLen[type] < this.alignment
          ? plc.plcTypeLen[type]
          : this.alignment;

      if (
        reqDescr.calcAlignment === true &&
        len > 1 &&
        type !== 'STRING' &&
        type !== 'EndStruct' &&
        pData.length > 0
      ) {
        mod = pData.length % len;
        if (mod > 0) {
          pcount = len - mod;
          for (let i = 1; i <= pcount; i++) {
            pData.push(0);
          }
        }
      }

      //Convert data, depending on the type
      if (type === 'EndStruct') {
        //Calculate the padding bytes at the end of the structure
        //"EndStruct" is only used with "readArrayOfStructures/writeArrayOfStructures".
        for (let i = 1; i <= item.val; i++) {
          pData.push(0);
        }
      } else {
        //Convert the data to a byte array.
        bytes = dataToByteArray(item, type, format, plc.plcTypeLen[type]);
        //Summarise the data.
        pData = pData.concat(bytes);
      }
    }

    //Convert the data to Base64.
    if (pData && pData.length > 0) {
      pData = encodeBase64(pData);
    }

    //Generate the ADS request object and call the send .
    adsReq = {
      method: 'Write',
      indexGroup: this.getIndexGroup(reqDescr),
      indexOffset: this.getIndexOffset(reqDescr),
      pData: pData,
      reqDescr: reqDescr,
    };
    this.createRequest(adsReq).send();
  }

  /**
   * This is the  for creating a read request. If no value for the
   * data length ist passed, calculate the value and then call the
   * for sending the request.
   *
   * @param {Object}  reqDescr    The Request Descriptor. Besides other information
   *                              this object contains the allocation of PLC and
   *                              JavaScript variables in an item list.
   */
  readReq(reqDescr) {
    let adsReq = {},
      itemList = reqDescr.items,
      arrType = [],
      item,
      format,
      type,
      listlen,
      mod,
      vlen,
      strlen,
      startaddr;

    //Calculate the data length if no argument is given.
    if (typeof reqDescr.readLength !== 'number') {
      reqDescr.readLength = 0;

      for (let idx = 0, listlen = itemList.length; idx < listlen; idx++) {
        item = itemList[idx];

        //Get type and formatting string.
        arrType = getTypeAndFormat(item);
        type = arrType[0];
        format = arrType[1];

        //Set the length of the PLC variable.
        if (isNaN(plc.plcTypeLen[type])) {
          log(
            'TAME library error: Could not get the length of the data type: ' +
              type,
          );
          log(
            'TAME library error: Probably wrong type definition. Please check the manual.',
          );
          log(reqDescr);
          return;
        }
        if (type === 'STRING') {
          if (typeof format === 'string') {
            strlen = parseInt(format, 10);
          }
          vlen = (isValidStringLen(strlen) ? strlen : plc.plcTypeLen[type]) + 1;
        } else {
          vlen = plc.plcTypeLen[type];
        }

        if (reqDescr.seq === true) {
          //Add the length of the PLC variables if continuously addressing is used.
          if (
            reqDescr.calcAlignment === true &&
            vlen > 1 &&
            type !== 'EndStruct' &&
            type !== 'STRING' &&
            reqDescr.readLength > 0
          ) {
            mod = reqDescr.readLength % vlen;
            if (mod > 0) {
              reqDescr.readLength += vlen - mod;
            }
          }
          reqDescr.readLength += vlen;
        } else {
          //Last element if single addresses are given.
          startaddr = this.getIndexOffset(reqDescr);
          reqDescr.readLength = vlen + item.addr - startaddr;
        }
      }
    }

    //Generate the ADS request object and call the send .
    adsReq = {
      method: 'Read',
      indexGroup: this.getIndexGroup(reqDescr),
      indexOffset: this.getIndexOffset(reqDescr),
      reqDescr: reqDescr,
    };
    createRequest(adsReq).send();
  }

  /**
   * This is the  for creating a sum read request.
   *
   * @param {Object}  reqDescr    The Request Descriptor. Besides other information
   *                              this object contains the allocation of PLC and
   *                              JavaScript variables in an item list.
   */
  sumReadReq(reqDescr) {
    let adsReq = {},
      itemList = reqDescr.items,
      reqBuffer = [],
      bytes = [],
      listlen = itemList.length,
      dummy = {},
      format,
      item,
      len,
      pwrData,
      itemInfo;

    //Preset the read lenth with the number of byte for error codes.
    reqDescr.readLength = listlen * 4;

    //Build the Request Buffer
    for (let idx = 0; idx < listlen; idx++) {
      item = itemList[idx];

      itemInfo = this.getItemInformation(item);

      //Length of the data type.
      len = itemInfo.size;

      reqDescr.readLength += len;

      //Build the request buffer.
      //The  dataToByteArray expects an item with a value for
      //converting, so a dummy object is used here.
      dummy.val = this.getIndexGroup(itemInfo);
      bytes = dataToByteArray(dummy, 'UDINT', format, 4);
      reqBuffer = reqBuffer.concat(bytes);

      dummy.val = getIndexOffset(itemInfo);
      bytes = dataToByteArray(dummy, 'UDINT', format, 4);
      reqBuffer = reqBuffer.concat(bytes);

      dummy.val = len;
      bytes = dataToByteArray(dummy, 'UDINT', format, 4);
      reqBuffer = reqBuffer.concat(bytes);
    }

    //Convert the request buffer to Base64 coded data.
    if (reqBuffer.length > 0) {
      pwrData = encodeBase64(reqBuffer);
    }

    //Generate the ADS request object and call the send .
    adsReq = {
      method: 'ReadWrite',
      indexGroup: plc.indexGroups.SumRd,
      indexOffset: itemList.length,
      pwrData: pwrData,
      reqDescr: reqDescr,
    };
    createRequest(adsReq).send();
  }

  /**
   * This is the  for creating a sum write request.
   *
   * @param {Object}  reqDescr    The Request Descriptor. Besides other information
   *                              this object contains the allocation of PLC and
   *                              JavaScript variables in an item list.
   */
  sumWriteReq(reqDescr) {
    let adsReq = {},
      itemList = reqDescr.items,
      reqBuffer = [],
      bytes = [],
      listlen = itemList.length,
      dummy = {},
      vlenMax = 0,
      type,
      format,
      item,
      len,
      pwrData,
      i,
      k,
      arrayLength,
      pcount,
      itemInfo;

    /**
     *  for getting the length of a variable.
     */
    const getVarLength = () => {
      let strlen;

      len = plc.plcTypeLen[type];

      if (type === 'STRING') {
        if (format !== undefined) {
          strlen = parseInt(format, 10);
        } else if (typeof itemInfo.stringLength === 'number') {
          strlen = itemInfo.stringLength;
        }
        format = isValidStringLen(strlen) ? strlen : len;
      }
    };

    /*
     * Parse the stucture definition.
     */
    const parseStruct = () => {
      let j,
        defArr,
        lenArrElem,
        lastDefArr,
        mod,
        elem,
        subBuffer = [];

      /**
       *  for adding padding bytes if an alignment is used.
       */
      const checkAlignment = () => {
        let vlen, k;

        if (alignment > 1 && type !== 'STRING' && type !== 'EndStruct') {
          //Set the length for calculating padding bytes
          vlen = len < alignment ? len : alignment;

          //Compute the padding bytes for the alignment.
          if (vlen > 1 && subBuffer.length > 0) {
            mod = subBuffer.length % vlen;
            if (mod > 0) {
              pcount = vlen - mod;
              for (k = 1; k <= pcount; k++) {
                subBuffer.push(0);
              }
            }
          }

          //Store the maximum length of the PLC variables
          //for inserting padding bytes at the end of the structure.
          if (vlen > vlenMax) {
            vlenMax = vlen;
          }
        }
      };
      s;
      //Check structure definition
      if (typeof item.def === 'string') {
        item.def = parseVarName(item.def);
      } else if (this.dataTypeTableOk === true && item.def === undefined) {
        item.def = this.createStructDef(itemInfo.dataType);
      } else if (typeof item.def !== 'object') {
        log('TAME library error: No structure defininition found!');
      }

      //Walk through the structure definiton
      for (elem in item.def) {
        if (item.def.hasOwnProperty(elem)) {
          try {
            defArr = item.def[elem].split('.');

            if (defArr[0] === 'ARRAY') {
              lenArrElem = parseInt(defArr[1], 10);
              lastDefArr = defArr.length - 1;
              for (j = 0; j < lenArrElem; j++) {
                type = defArr[2];
                if (defArr[lastDefArr] === 'SP') {
                  if (lastDefArr >= 4) {
                    format = defArr.slice(3, -1).join('.');
                  }
                } else {
                  if (lastDefArr >= 3) {
                    format = defArr.slice(3).join('.');
                  }
                }

                //Add index in case of an array of struct
                if (i !== null) {
                  if (defArr[lastDefArr] === 'SP') {
                    dummy.val = item.val[i][elem + j];
                  } else {
                    dummy.val = item.val[i][elem][j];
                  }
                } else {
                  dummy.val = item.val[elem][j];
                }

                getVarLength();
                checkAlignment();
                bytes = dataToByteArray(dummy, type, format, len);
                subBuffer = subBuffer.concat(bytes);
              }
            } else {
              //Check if we are in an array of struct
              if (i !== null) {
                dummy.val = item.val[i][elem];
              } else {
                dummy.val = item.val[elem];
              }

              type = defArr[0];
              if (defArr.length > 2) {
                defArr[1] = defArr.slice(1).join('.');
              }
              format = defArr[1];
              getVarLength();

              checkAlignment();
              bytes = dataToByteArray(dummy, type, format, len);
              subBuffer = subBuffer.concat(bytes);
            }
          } catch (e) {
            log(
              'TAME library error: Could not set values for a structure in SumWriteReq: ' +
                e,
            );
            log(item);
          }
        }
      }

      //Calculate the padding bytes at the end of the structure.
      if (
        this.alignment > 1 &&
        vlenMax > 1 &&
        defArr[0] !== 'STRING' &&
        defArr[0] !== 'EndStruct'
      ) {
        mod = subBuffer.length % vlenMax;
        if (mod > 0) {
          pcount = vlenMax - mod;
          for (k = 1; k <= pcount; k++) {
            subBuffer.push(0);
          }
        }
      }

      //Add the subPuffer with the structure data to the request buffer.
      reqBuffer = reqBuffer.concat(subBuffer);
    };

    //Preset the read length with the number of byte for error codes.
    reqDescr.readLength = listlen * 4;

    //Write the general command information to the Request Buffer
    for (let idx = 0; idx < listlen; idx++) {
      item = itemList[idx];

      itemInfo = this.getItemInformation(item);

      //Get type and formatting string.
      type = itemInfo.type;
      format = itemInfo.format;

      //Length of the data type.
      len = itemInfo.size;

      //Build the request buffer.
      //The  dataToByteArray expects an item with a value for
      //converting, so a dummy object is used here.
      dummy.val = this.getIndexGroup(itemInfo);
      bytes = dataToByteArray(dummy, 'UDINT', format, 4);
      reqBuffer = reqBuffer.concat(bytes);

      dummy.val = this.getIndexOffset(itemInfo);
      bytes = dataToByteArray(dummy, 'UDINT', format, 4);
      reqBuffer = reqBuffer.concat(bytes);

      dummy.val = len;
      bytes = dataToByteArray(dummy, 'UDINT', format, 4);
      reqBuffer = reqBuffer.concat(bytes);
    }

    //Write the data to the Request Buffer
    for (let idx = 0; idx < listlen; idx++) {
      item = itemList[idx];

      itemInfo = this.getItemInformation(item);

      //Get type and formatting string.
      type = itemInfo.type;
      format = itemInfo.format;

      //Length of the data type.
      len = itemInfo.size;

      //Reset counter for arrays.
      i = null;

      //Build the request buffer.
      //The  dataToByteArray expects an item with a value for
      //converting, so a dummy object is used here.
      switch (type) {
        case 'ARRAY':
          arrayLength = parseInt(itemInfo.arrayLength, 10);

          if (arrayLength !== item.val.length) {
            log(
              'TAME library error: Array length in JS differs from the length in the PLC!',
            );
            log('Length in JS: ' + item.val.length);
            log('Length in PLC: ' + arrayLength);
            log(item);
            return;
          }

          if (itemInfo.arrayDataType === 'USER') {
            //Array of structures.
            for (let i = 0; i < arrayLength; i++) {
              parseStruct();
            }
          } else {
            //Plain array.
            type = itemInfo.arrayDataType;

            if (type === 'STRING') {
              format = itemInfo.stringLength;
            } else {
              len = itemInfo.itemSize;
            }

            for (let i = 0; i < arrayLength; i++) {
              dummy.val = item.val[i];
              bytes = dataToByteArray(dummy, type, format, len);
              reqBuffer = reqBuffer.concat(bytes);
            }
          }
          break;
        case 'USER':
          //Structures.
          parseStruct();
          break;
        default:
          //Simple data types.
          if (type === 'STRING') {
            format = itemInfo.stringLength;
          } else {
            len = itemInfo.size;
          }
          bytes = dataToByteArray(item, type, format, len);
          reqBuffer = reqBuffer.concat(bytes);
      }
    }

    //Convert the request buffer to Base64 coded data.
    if (reqBuffer.length > 0) {
      pwrData = encodeBase64(reqBuffer);
    }

    //Generate the ADS request object and call the send .
    adsReq = {
      method: 'ReadWrite',
      indexGroup: plc.indexGroups.SumWr,
      indexOffset: itemList.length,
      pwrData: pwrData,
      reqDescr: reqDescr,
    };
    this.createRequest(adsReq).send();
  }

  /**
   * This is the  for creating a sum read request.
   *
   * @param {Object}  reqDescr    The Request Descriptor. Besides other information
   *                              this object contains the allocation of PLC and
   *                              JavaScript variables in an item list.
   */
  readAdsState(reqDescr: unknown) {
    //Generate the ADS request object and call the send .
    const adsReq = {
      method: 'ReadState',
      reqDescr: reqDescr,
    };
    this.createRequest(adsReq).send();
  }

  /**
   * Converts the Symbol Table to a JSON string.
   *
   * @return {Array}  jstr    The Symbol Table as a JSON string .
   */
  getSymbolsAsJSON() {
    let jstr;

    if (typeof JSON !== 'object') {
      log('TAME library error: No JSON parser found.');
    } else {
      try {
        jstr = JSON.stringify(this.symTable);
        return jstr;
      } catch (e) {
        log(
          'TAME library error: Could not convert the Symbol Table to JSON:' + e,
        );
      }
    }
  }

  /**
   * Reads the Symbol Table from a JSON string
   *
   * @param {String}  jstr    A JSON string with the symbols.
   */
  setSymbolsFromJSON(jstr: string) {
    if (typeof JSON !== 'object') {
      log('TAME library error: No JSON parser found.');
    } else {
      try {
        this.symTable = JSON.parse(jstr);
      } catch (e) {
        log(
          'TAME library error: Could not create the Symbol Table from JSON:' +
            e,
        );
        return;
      }
      this.symTableOk = true;
      log(
        'TAME library info: Symbol Table successfully created from JSON data.',
      );
    }
  }

  /**
   * Converts the Data Type Table to a JSON string.
   *
   * @return {Array}  jstr    The Data Type Table as a JSON string .
   */
  getDataTypesAsJSON() {
    let jstr;

    if (typeof JSON !== 'object') {
      log('TAME library error: No JSON parser found.');
    } else {
      try {
        jstr = JSON.stringify(this.dataTypeTable);
        return jstr;
      } catch (e) {
        log(
          'TAME library error: Could not convert the Data Type Table to JSON:' +
            e,
        );
      }
    }
  }

  /**
   * Reads the Data Type Table from a JSON string
   *
   * @param {String}  jstr    A JSON string with the data types.
   */
  setDataTypesFromJSON(jstr: string) {
    if (typeof JSON !== 'object') {
      log('TAME library error: No JSON parser found.');
    } else {
      try {
        this.dataTypeTable = JSON.parse(jstr);
      } catch (e) {
        log(
          'TAME library error: Could not create the Data Type Table from JSON:' +
            e,
        );
        return;
      }
      this.dataTypeTableOk = true;
      log(
        'TAME library info: Data Type Table successfully created from JSON data.',
      );
    }
  }

  /**
   * Process the webservice's server response.
   *
   * @param {Object} adsReq   The object containing the arguments of the ADS request.
   */
  parseResponse(adsReq) {
    let response, errorCode, errorText;

    //Acknowledge the receive of a request with index 'id'.
    if (typeof adsReq.reqDescr.id === 'number') {
      currReq[adsReq.reqDescr.id] = 0;
    }

    //Check if the XML data object is valid.
    if (adsReq.xmlHttpReq.responseXML === null) {
      log(
        'TAME library error: Request contains no XML data. Object "responseXML" is null.',
      );
      log('TAME library error: This is the "responseText":');
      log(adsReq.xmlHttpReq.responseText);
    }

    try {
      response = adsReq.xmlHttpReq.responseXML.documentElement;
    } catch (e) {
      log('TAME library error: No XML data in server response:' + e);
      return;
    }

    //Look for errors in the response string.
    try {
      errorText =
        response.getElementsByTagName('faultstring')[0].firstChild.data;
      try {
        errorCode =
          response.getElementsByTagName('errorcode')[0].firstChild.data;
      } catch (e) {
        errorCode = '-';
      }
      log(
        'TAME library error: Message from server:  ' +
          errorText +
          ' (' +
          errorCode +
          ')',
      );

      return;
    } catch (ex) {
      errorCode = 0;
    }

    //Normalize data (esp. for Firefox, who splits data in 4k chunks).
    if (typeof response.normalize === '') {
      response.normalize();
    }

    //Decode data if it's a read request.
    if (adsReq.method === 'ReadState') {
      this.parseAdsState(adsReq);
    } else if (adsReq.method === 'Read' || adsReq.method === 'ReadWrite') {
      switch (adsReq.indexGroup) {
        case plc.indexGroups.UploadInfo:
          this.parseUploadInfo(adsReq);
          break;
        case plc.indexGroups.Upload:
          this.parseUpload(adsReq);
          break;
        case plc.indexGroups.SumRd:
          this.parseSumReadReq(adsReq);
          break;
        case plc.indexGroups.SumWr:
          this.parseSumWriteReq(adsReq);
          break;
        default:
          this.parseReadReq(adsReq);
      }
    }

    //Call the On-Complete-Script.
    if (typeof adsReq.reqDescr.oc === '') {
      if (typeof adsReq.reqDescr.ocd === 'number') {
        window.setTimeout(adsReq.reqDescr.oc, adsReq.reqDescr.ocd);
      } else {
        adsReq.reqDescr.oc();
      }
    }
  }

  /**
   * The shortcuts for reading and writing data.
   *
   * @param {Object} args
   */
  writeBool(args) {
    this.createSingleDescriptor('Write', 'BOOL', args);
  }
  writeByte(args) {
    this.createSingleDescriptor('Write', 'BYTE', args);
  }
  writeUsint(args) {
    this.createSingleDescriptor('Write', 'USINT', args);
  }
  writeSint(args) {
    this.createSingleDescriptor('Write', 'SINT', args);
  }
  writeWord(args) {
    this.createSingleDescriptor('Write', 'WORD', args);
  }
  writeUint(args) {
    this.createSingleDescriptor('Write', 'UINT', args);
  }
  writeInt(args) {
    this.createSingleDescriptor('Write', 'INT', args);
  }
  writeInt1Dp(args) {
    this.createSingleDescriptor('Write', 'INT1DP', args);
  }
  writeDword(args) {
    this.createSingleDescriptor('Write', 'DWORD', args);
  }
  writeUdint(args) {
    this.createSingleDescriptor('Write', 'UDINT', args);
  }
  writeDint(args) {
    this.createSingleDescriptor('Write', 'DINT', args);
  }
  writeReal(args) {
    this.createSingleDescriptor('Write', 'REAL', args);
  }
  writeLreal(args) {
    this.createSingleDescriptor('Write', 'LREAL', args);
  }
  writeString(args) {
    this.createSingleDescriptor('Write', 'STRING', args);
  }
  writeTime(args) {
    this.createSingleDescriptor('Write', 'TIME', args);
  }
  writeTod(args) {
    this.createSingleDescriptor('Write', 'TOD', args);
  }
  writeDate(args) {
    this.createSingleDescriptor('Write', 'DATE', args);
  }
  writeDt(args) {
    this.createSingleDescriptor('Write', 'DT', args);
  }

  readBool(args) {
    this.createSingleDescriptor('Read', 'BOOL', args);
  }
  readByte(args) {
    this.createSingleDescriptor('Read', 'BYTE', args);
  }
  readUsint(args) {
    this.createSingleDescriptor('Read', 'USINT', args);
  }
  readSint(args) {
    this.createSingleDescriptor('Read', 'SINT', args);
  }
  readWord(args) {
    this.createSingleDescriptor('Read', 'WORD', args);
  }
  readUint(args) {
    this.createSingleDescriptor('Read', 'UINT', args);
  }
  readInt(args) {
    this.createSingleDescriptor('Read', 'INT', args);
  }
  readInt1Dp(args) {
    this.createSingleDescriptor('Read', 'INT1DP', args);
  }
  readDword(args) {
    this.createSingleDescriptor('Read', 'DWORD', args);
  }
  readUdint(args) {
    this.createSingleDescriptor('Read', 'UDINT', args);
  }
  readDint(args) {
    this.createSingleDescriptor('Read', 'DINT', args);
  }
  readReal(args) {
    this.createSingleDescriptor('Read', 'REAL', args);
  }
  readLreal(args) {
    this.createSingleDescriptor('Read', 'LREAL', args);
  }
  readString(args) {
    this.createSingleDescriptor('Read', 'STRING', args);
  }
  readTime(args) {
    this.createSingleDescriptor('Read', 'TIME', args);
  }
  readTod(args) {
    this.createSingleDescriptor('Read', 'TOD', args);
  }
  readDate(args) {
    this.createSingleDescriptor('Read', 'DATE', args);
  }
  readDt(args) {
    this.createSingleDescriptor('Read', 'DT', args);
  }

  writeStruct(args) {
    this.createStructDescriptor('Write', args);
  }
  readStruct(args) {
    this, createStructDescriptor('Read', args);
  }

  writeArrayOfBool(args) {
    this.createArrayDescriptor('Write', 'BOOL', args);
  }
  writeArrayOfByte(args) {
    this.createArrayDescriptor('Write', 'BYTE', args);
  }
  writeArrayOfUsint(args) {
    this.createArrayDescriptor('Write', 'USINT', args);
  }
  writeArrayOfSint(args) {
    this.createArrayDescriptor('Write', 'SINT', args);
  }
  writeArrayOfWord(args) {
    this.createArrayDescriptor('Write', 'WORD', args);
  }
  writeArrayOfUint(args) {
    this.createArrayDescriptor('Write', 'UINT', args);
  }
  writeArrayOfInt(args) {
    this.createArrayDescriptor('Write', 'INT', args);
  }
  writeArrayOfInt1Dp(args) {
    this.createArrayDescriptor('Write', 'INT1DP', args);
  }
  writeArrayOfDword(args) {
    this.createArrayDescriptor('Write', 'DWORD', args);
  }
  writeArrayOfUdint(args) {
    this.createArrayDescriptor('Write', 'UDINT', args);
  }
  writeArrayOfDint(args) {
    this.createArrayDescriptor('Write', 'DINT', args);
  }
  writeArrayOfReal(args) {
    this.createArrayDescriptor('Write', 'REAL', args);
  }
  writeArrayOfLreal(args) {
    this.createArrayDescriptor('Write', 'LREAL', args);
  }
  writeArrayOfString(args) {
    this.createArrayDescriptor('Write', 'STRING', args);
  }
  writeArrayOfTime(args) {
    this.createArrayDescriptor('Write', 'TIME', args);
  }
  writeArrayOfTod(args) {
    this.createArrayDescriptor('Write', 'TOD', args);
  }
  writeArrayOfDate(args) {
    this.createArrayDescriptor('Write', 'DATE', args);
  }
  writeArrayOfDt(args) {
    this.createArrayDescriptor('Write', 'DT', args);
  }
  writeArrayOfStruct(args) {
    this.createArrayDescriptor('Write', 'STRUCT', args);
  }

  readArrayOfBool(args) {
    this.createArrayDescriptor('Read', 'BOOL', args);
  }
  readArrayOfByte(args) {
    this.createArrayDescriptor('Read', 'BYTE', args);
  }
  readArrayOfUsint(args) {
    this.createArrayDescriptor('Read', 'USINT', args);
  }
  readArrayOfSint(args) {
    this.createArrayDescriptor('Read', 'SINT', args);
  }
  readArrayOfWord(args) {
    this.createArrayDescriptor('Read', 'WORD', args);
  }
  readArrayOfUint(args) {
    this.createArrayDescriptor('Read', 'UINT', args);
  }
  readArrayOfInt(args) {
    this.createArrayDescriptor('Read', 'INT', args);
  }
  readArrayOfInt1Dp(args) {
    this.createArrayDescriptor('Read', 'INT1DP', args);
  }
  readArrayOfDword(args) {
    this.createArrayDescriptor('Read', 'DWORD', args);
  }
  readArrayOfUdint(args) {
    this.createArrayDescriptor('Read', 'UDINT', args);
  }
  readArrayOfDint(args) {
    this.createArrayDescriptor('Read', 'DINT', args);
  }
  readArrayOfReal(args) {
    this.createArrayDescriptor('Read', 'REAL', args);
  }
  readArrayOfLreal(args) {
    this.createArrayDescriptor('Read', 'LREAL', args);
  }
  readArrayOfString(args) {
    this.createArrayDescriptor('Read', 'STRING', args);
  }
  readArrayOfTime(args) {
    this.createArrayDescriptor('Read', 'TIME', args);
  }
  readArrayOfTod(args) {
    this.createArrayDescriptor('Read', 'TOD', args);
  }
  readArrayOfDate(args) {
    this.createArrayDescriptor('Read', 'DATE', args);
  }
  readArrayOfDt(args) {
    this.createArrayDescriptor('Read', 'DT', args);
  }
  readArrayOfStruct(args) {
    this.createArrayDescriptor('Read', 'STRUCT', args);
  }

  //======================================================================================
  //                   Methods for Creating the Symbol Table from Upload
  //                                 or the TPY File
  //======================================================================================

  /**
   *  Get the upload info.
   */

  getUploadInfo() {
    log('getUploadInfo');

    //Generate the ADS request object and call the send .
    const adsReq = {
      method: 'Read',
      sync: true,
      indexGroup: plc.indexGroups.UploadInfo,
      indexOffset: 0,
      reqDescr: {
        readLength: 8,
      },
    };
    createRequest(adsReq).send();
  }

  /**
   * Parse the upload information and call the request for
   * reading the upload data.
   *
   * @param {Object} adsReq   An ADS Request Descriptor.
   */
  parseUploadInfo(adsReq: AdsRequest) {
    let response, dataString, dataSubString, adsReq2, uploadLength;

    try {
      response = adsReq.xmlHttpReq.responseXML.documentElement;
      dataString = decodeBase64(
        response.getElementsByTagName('ppData')[0].firstChild.data,
      );
      dataSubString = dataString.substr(0, 4);
      this.symbolCount = subStringToData(dataSubString, 'DWORD');
      dataSubString = dataString.substr(4, 4);
      uploadLength = subStringToData(dataSubString, 'DWORD');
    } catch (e) {
      log('TAME library error: Parsing of UploadInfo failed:' + e);
      return;
    }

    adsReq2 = {
      method: 'Read',
      sync: true,
      indexGroup: plc.indexGroups.Upload,
      indexOffset: 0,
      reqDescr: {
        readLength: uploadLength,
      },
    };
    createRequest(adsReq2).send();
  }

  /**
   * Parse the upload data and an object (this.symTable) with the symbol names
   * as the properties.
   *
   * @param {Object} adsReq   An ADS Request Descriptor.
   */
  parseUpload(adsReq) {
    let response,
      strAddr = 0,
      igOffs = 4,
      ioOffs = 8,
      sizeOffs = 12,
      nameOffs = 30,
      dataString,
      dataSubString,
      cnt,
      infoLen,
      nameAndType,
      typeArr,
      arrayLength,
      type,
      elem;

    try {
      response = adsReq.xmlHttpReq.responseXML.documentElement;
      dataString = decodeBase64(
        response.getElementsByTagName('ppData')[0].firstChild.data,
      );

      for (cnt = 0; cnt < this.symbolCount; cnt++) {
        //Get the length of the symbol information.
        dataSubString = dataString.substr(strAddr, 4);
        infoLen = subStringToData(dataSubString, 'DWORD');

        //Get name and type.
        nameAndType = dataString
          .substring(strAddr + nameOffs, strAddr + infoLen)
          .split(String.fromCharCode(0));
        name = nameAndType[0].toUpperCase();

        //Create an entry.
        this.symTable[name] = {
          typeString: nameAndType[1],
          indexGroup: subStringToData(
            dataString.substr(strAddr + igOffs, 4),
            'DWORD',
          ),
          indexOffset: subStringToData(
            dataString.substr(strAddr + ioOffs, 4),
            'DWORD',
          ),
          size: subStringToData(
            dataString.substr(strAddr + sizeOffs, 4),
            'DWORD',
          ),
        };

        //Set additional information.
        typeArr = nameAndType[1].split(' ');

        if (typeArr[0] === 'ARRAY') {
          //Type
          this.symTable[name].type = typeArr[0];

          //Array Length
          arrayLength = typeArr[1].substring(1, typeArr[1].length - 1);
          arrayLength = arrayLength.split('..');
          this.symTable[name].arrStartIdx = parseInt(arrayLength[0], 10);
          arrayLength =
            parseInt(arrayLength[1], 10) - parseInt(arrayLength[0], 10) + 1;
          this.symTable[name].arrayLength = arrayLength;

          //Data type of the array.
          type = typeArr[3].split('(');
          if (type[1] !== undefined) {
            type[1] = type[1].substr(0, type[1].length - 1);
            this.symTable[name].fullType =
              typeArr[0] + '.' + arrayLength + '.' + type[0] + '.' + type[1];
            this.symTable[name].stringLength = parseInt(type[1], 10);
          } else {
            this.symTable[name].fullType =
              typeArr[0] + '.' + arrayLength + '.' + type[0];
          }

          //Item length
          this.symTable[name].itemSize = this.symTable[name].size / arrayLength;

          //Check if variable is a user defined data type,
          this.symTable[name].arrayDataType = 'USER';
          for (elem in plc.plcTypeLen) {
            if (plc.plcTypeLen.hasOwnProperty(elem)) {
              if (type[0] === elem) {
                this.symTable[name].arrayDataType = type[0];
              }
            }
          }
          if (this.symTable[name].arrayDataType === 'USER') {
            this.symTable[name].dataType = type[0];
          }
        } else {
          type = typeArr[0].split('(');

          if (type[1] !== undefined) {
            //String
            type[1] = type[1].substr(0, type[1].length - 1);
            this.symTable[name].fullType = type[0] + '.' + type[1];
            this.symTable[name].stringLength = parseInt(type[1], 10);
          } else {
            this.symTable[name].fullType = type[0];
          }

          //Check if variable is a user defined data type,
          this.symTable[name].type = 'USER';
          for (elem in plc.plcTypeLen) {
            if (plc.plcTypeLen.hasOwnProperty(elem)) {
              if (type[0] === elem) {
                this.symTable[name].type = type[0];
              }
            }
          }
          if (this.symTable[name].type === 'USER') {
            this.symTable[name].dataType = type[0];
          }
        }

        strAddr += infoLen;
      }
      this.symTableOk = true;

      log('TAME library info: End of fetching the symbols.');
      log('TAME library info: Symbol table ready.');
    } catch (e) {
      log(
        'TAME library error: Parsing of uploaded symbol information failed:' +
          e,
      );
      return;
    }
  }

  /**
   * Get the symbol-file (*.tpy) from the server and create
   * an object (this.symTable) with the symbol names as the properties.
   */
  getConfigFile() {
    let xmlHttpReq = createXMLHttpReq(),
      symbolArray = [],
      configFile,
      name,
      allSymbols,
      typeArr,
      arrayLength,
      type,
      elem,
      tcVersion;

    //Synchronous HTTPRequest
    xmlHttpReq.open('GET', sthis.ervice.configFileUrl, false);
    xmlHttpReq.setRequestHeader('Content-Type', 'text/xml');
    xmlHttpReq.send(null);

    log('TAME library info: Start reading the TPY file.');

    fetch(this.service.configFileUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'text/xml' },
    })
      .then((response) => {
        return response.text();
      })
      .then((data) => {
        configFile = data;
      });

    //Create a DOM object from XML
    try {
      configFile = xmlParser(xmlHttpReq.responseText);
    } catch (e) {
      log('TAME library error: Creating a DOM object from TPY failed:' + e);
      return;
    }

    //Get the information about the PLC and the routing
    if (
      typeof this.service.amsNetId !== 'string' ||
      typeof this.service.amsPort !== 'string' ||
      this.alignment === 0
    ) {
      log(
        'TAME library info: Start reading the service information from the TPY file.',
      );
      try {
        this.serviceInfo = {
          netId:
            configFile.getElementsByTagName('NetId')[0].childNodes[0].nodeValue,
          port: configFile.getElementsByTagName('Port')[0].childNodes[0]
            .nodeValue,
          alignment: 0,
        };

        tcVersion = configFile
          .getElementsByTagName('TwinCATVersion')[0]
          .childNodes[0].nodeValue.charAt(0);

        if (tcVersion === '2') {
          this.serviceInfo.alignment = parseInt(
            configFile.getElementsByTagName('PackSize')[0].childNodes[0]
              .nodeValue,
            10,
          );
        } else if (tcVersion === '3') {
          this.serviceInfo.alignment = 8;
        } else {
          log('TAME library error: Could not determine the TwinCAT version.');
        }
        log(
          'TAME library info: End of reading the service information from the TPY file.',
        );
      } catch (e) {
        log(
          'TAME library error: An error occured while reading service information from the TPY file:',
        );
        log(e);
      }
    } else {
      log(
        'TAME library info: NetId, port and alignment manually set. Skip reading the service information from the TPY file.',
      );
    }

    //Create the symbol table
    if (this.service.forceUploadUsage !== true) {
      log('TAME library info: Start reading the symbols from the TPY file.');
      try {
        //Create an Array of the Elements with "Symbol" as tag name.
        allSymbols = configFile.getElementsByTagName('Symbols')[0];
        symbolArray = allSymbols.getElementsByTagName('Symbol');

        //Get the name of the symbol and create an object property with it.
        //this.symTable is declared outside in the constructor .
        for (let i = 0; i < symbolArray.length; i++) {
          name = symbolArray[i]
            .getElementsByTagName('Name')[0]
            .childNodes[0].nodeValue.toUpperCase();
          this.symTable[name] = {
            typeString: symbolArray[i]
              .getElementsByTagName('Type')[0]
              .childNodes[0].nodeValue.toUpperCase(),
            indexGroup: parseInt(
              symbolArray[i].getElementsByTagName('IGroup')[0].childNodes[0]
                .nodeValue,
              10,
            ),
            indexOffset: parseInt(
              symbolArray[i].getElementsByTagName('IOffset')[0].childNodes[0]
                .nodeValue,
              10,
            ),
            bitSize: parseInt(
              symbolArray[i].getElementsByTagName('BitSize')[0].childNodes[0]
                .nodeValue,
              10,
            ),
          };
          this.symTable[name].size =
            this.symTable[name].bitSize >= 8
              ? this.symTable[name].bitSize / 8
              : this.symTable[name].bitSize;

          //Set additional information.
          typeArr = this.symTable[name].typeString.split(' ');

          if (typeArr[0] === 'ARRAY') {
            //Type
            this.symTable[name].type = typeArr[0];

            //Array length
            arrayLength = typeArr[1].substring(1, typeArr[1].length - 1);
            arrayLength = arrayLength.split('..');
            this.symTable[name].arrStartIdx = parseInt(arrayLength[0], 10);
            arrayLength =
              parseInt(arrayLength[1], 10) - parseInt(arrayLength[0], 10) + 1;
            this.symTable[name].arrayLength = arrayLength;

            //Data type of the array.
            type = typeArr[3].split('(');
            if (type[1] !== undefined) {
              type[1] = type[1].substr(0, type[1].length - 1);
              this.symTable[name].fullType =
                typeArr[0] + '.' + arrayLength + '.' + type[0] + '.' + type[1];
              this.symTable[name].stringLength = parseInt(type[1], 10);
            } else {
              this.symTable[name].fullType =
                typeArr[0] + '.' + arrayLength + '.' + type[0];
            }

            //Item length
            this.symTable[name].itemSize =
              this.symTable[name].size / arrayLength;

            //Check if variable is a user defined data type,
            this.symTable[name].arrayDataType = 'USER';
            for (elem in plc.plcTypeLen) {
              if (plc.plcTypeLen.hasOwnProperty(elem)) {
                if (type[0] === elem) {
                  this.symTable[name].arrayDataType = type[0];
                }
              }
            }
            if (this.symTable[name].arrayDataType === 'USER') {
              this.symTable[name].dataType = type[0];
            }
          } else {
            type = typeArr[0].split('(');

            if (type[1] !== undefined) {
              //String
              type[1] = type[1].substr(0, type[1].length - 1);
              this.symTable[name].fullType = type[0] + '.' + type[1];
              this.symTable[name].stringLength = parseInt(type[1], 10);
            } else {
              this.symTable[name].fullType = type[0];
            }

            //Check if variable is a user defined data type,
            this.symTable[name].type = 'USER';
            for (elem in plc.plcTypeLen) {
              if (plc.plcTypeLen.hasOwnProperty(elem)) {
                if (type[0] === elem) {
                  this.symTable[name].type = type[0];
                }
              }
            }
            if (this.symTable[name].type === 'USER') {
              this.symTable[name].dataType = type[0];
            }
          }
        }

        this.symTableOk = true;

        log('TAME library info: End of reading the symbols from the TPY file.');
        log('TAME library info: Symbol table ready.');
      } catch (e) {
        log(
          'TAME library error: An error occured while parsing the symbol file:',
        );
        log(e);
      }
    } else {
      log(
        'TAME library info: Reading the symbols from the TPY file is deactivated.',
      );
    }

    //Get the data types.
    let allDataTypes, dataTypeArray, subItemArray, sName, fullName;

    if (true) {
      log('TAME library info: Start reading the data types from the TPY file.');
      try {
        //Create an Array of the Elements with "DataType" as tag name.
        allDataTypes = configFile.getElementsByTagName('DataTypes')[0];
        dataTypeArray = allDataTypes.getElementsByTagName('DataType');

        //Get the name of the data type and create an object property with it.
        //this.dataTypeTable is declared outside in the constructor .
        //Arrays first
        for (let i = 0; i < dataTypeArray.length; i++) {
          fullName = dataTypeArray[i]
            .getElementsByTagName('Name')[0]
            .childNodes[0].nodeValue.toUpperCase();
          name = fullName.split(' ')[0];
          if (name === 'ARRAY') {
            this.dataTypeTable[fullName] = {
              //type: dataTypeArray[i].getElementsByTagName('Type')[0].childNodes[0].nodeValue.toUpperCase(),
              bitSize: parseInt(
                dataTypeArray[i].getElementsByTagName('BitSize')[0]
                  .childNodes[0].nodeValue,
                10,
              ),
            };
            this.dataTypeTable[fullName].size =
              this.dataTypeTable[fullName].bitSize / 8;
          }
        }
        //Then the rest
        for (let i = 0; i < dataTypeArray.length; i++) {
          fullName = dataTypeArray[i]
            .getElementsByTagName('Name')[0]
            .childNodes[0].nodeValue.toUpperCase();
          name = fullName.split(' ')[0];
          if (name !== 'ARRAY') {
            this.dataTypeTable[name] = {
              //type: dataTypeArray[i].getElementsByTagName('Type')[0].childNodes[0].nodeValue.toUpperCase(),
              bitSize: parseInt(
                dataTypeArray[i].getElementsByTagName('BitSize')[0]
                  .childNodes[0].nodeValue,
                10,
              ),
              subItems: {},
            };
            this.dataTypeTable[name].size =
              this.dataTypeTable[name].bitSize / 8;
            //Get the SubItems
            subItemArray = dataTypeArray[i].getElementsByTagName('SubItem');

            for (let j = 0; j < subItemArray.length; j++) {
              sName = subItemArray[j]
                .getElementsByTagName('Name')[0]
                .childNodes[0].nodeValue.toUpperCase();
              this.dataTypeTable[name].subItems[sName] = {
                typeString: subItemArray[j]
                  .getElementsByTagName('Type')[0]
                  .childNodes[0].nodeValue.toUpperCase(),
                pointer: subItemArray[j]
                  .getElementsByTagName('Type')[0]
                  .hasAttribute('Pointer'),
                bitSize: parseInt(
                  subItemArray[j].getElementsByTagName('BitSize')[0]
                    .childNodes[0].nodeValue,
                  10,
                ),
              };
              if (
                subItemArray[j].getElementsByTagName('BitOffs')[0] !== undefined
              ) {
                this.dataTypeTable[name].subItems[sName].bitOffset = parseInt(
                  subItemArray[j].getElementsByTagName('BitOffs')[0]
                    .childNodes[0].nodeValue,
                  10,
                );
              }

              this.dataTypeTable[name].subItems[sName].size =
                this.dataTypeTable[name].subItems[sName].bitSize >= 8
                  ? this.dataTypeTable[name].subItems[sName].bitSize / 8
                  : this.dataTypeTable[name].subItems[sName].bitSize;

              //Set additional information
              typeArr =
                this.dataTypeTable[name].subItems[sName].typeString.split(' ');

              if (typeArr[0] === 'ARRAY') {
                //Type
                this.dataTypeTable[name].subItems[sName].type = typeArr[0];

                //Array Length
                arrayLength = typeArr[1].substring(1, typeArr[1].length - 1);
                arrayLength = arrayLength.split('..');
                this.dataTypeTable[name].subItems[sName].arrStartIdx = parseInt(
                  arrayLength[0],
                  10,
                );
                arrayLength =
                  parseInt(arrayLength[1], 10) -
                  parseInt(arrayLength[0], 10) +
                  1;
                this.dataTypeTable[name].subItems[sName].arrayLength =
                  arrayLength;

                //Data type of the array.
                type = typeArr[3].split('(');
                if (type[1] !== undefined) {
                  type[1] = type[1].substr(0, type[1].length - 1);
                  this.dataTypeTable[name].subItems[sName].fullType =
                    typeArr[0] +
                    '.' +
                    arrayLength +
                    '.' +
                    type[0] +
                    '.' +
                    type[1];
                  this.dataTypeTable[name].subItems[sName].stringLength =
                    parseInt(type[1], 10);
                } else {
                  this.dataTypeTable[name].subItems[sName].fullType =
                    typeArr[0] + '.' + arrayLength + '.' + type[0];
                }

                this.dataTypeTable[name].subItems[sName].bitSize =
                  this.dataTypeTable[
                    this.dataTypeTable[name].subItems[sName].typeString
                  ].bitSize;
                this.dataTypeTable[name].subItems[sName].size =
                  this.dataTypeTable[
                    this.dataTypeTable[name].subItems[sName].typeString
                  ].size;

                //Item length
                this.dataTypeTable[name].subItems[sName].itemSize =
                  this.dataTypeTable[name].subItems[sName].size / arrayLength;

                //Check if variable is a user defined data type,
                this.dataTypeTable[name].subItems[sName].arrayDataType = 'USER';
                for (elem in plc.plcTypeLen) {
                  if (plc.plcTypeLen.hasOwnProperty(elem)) {
                    if (type[0] === elem) {
                      this.dataTypeTable[name].subItems[sName].arrayDataType =
                        type[0];
                    }
                  }
                }
                if (
                  this.dataTypeTable[name].subItems[sName].arrayDataType ===
                  'USER'
                ) {
                  this.dataTypeTable[name].subItems[sName].dataType = type[0];
                }
              } else {
                type = typeArr[0].split('(');

                if (type[1] !== undefined) {
                  //String
                  type[1] = type[1].substr(0, type[1].length - 1);
                  this.dataTypeTable[name].subItems[sName].fullType =
                    type[0] + '.' + type[1];
                  this.dataTypeTable[name].subItems[sName].stringLength =
                    parseInt(type[1], 10);
                } else {
                  this.dataTypeTable[name].subItems[sName].fullType = type[0];
                }

                //Check if variable is a user defined data type,
                this.dataTypeTable[name].subItems[sName].type = 'USER';
                for (elem in plc.plcTypeLen) {
                  if (plc.plcTypeLen.hasOwnProperty(elem)) {
                    if (type[0] === elem) {
                      this.dataTypeTable[name].subItems[sName].type = type[0];
                    }
                  }
                }
                if (this.dataTypeTable[name].subItems[sName].type === 'USER') {
                  this.dataTypeTable[name].subItems[sName].dataType = type[0];
                }
              }
            }
          }
        }
        this.dataTypeTableOk = true;

        log(
          'TAME library info: End of reading the data types from the TPY file.',
        );
        log('TAME library info: Data type table ready.');
      } catch (e) {
        log(
          'TAME library error: An error occured while creating the data type information:',
        );
        log('Type: ' + fullName);
        log('SubItem: ' + sName);
        log(e);
      }
    }
  }

  /**
   *  Set the service parameter with the values read from the TPY file.
   */
  setServiceParamFromTPY() {
    if (typeof this.service.amsNetId !== 'string') {
      this.service.amsNetId = this.serviceInfo.netId;
      log(
        'TAME library info: No NetId definition found. NetId from TPY file is used.',
      );
    }

    if (typeof this.service.amsPort !== 'string') {
      this.service.amsPort = this.serviceInfo.port;
      log(
        'TAME library info: No AMS port definition found. Port number from TPY file is used.',
      );
    }

    if (this.alignment === 0) {
      if (this.serviceInfo.alignment !== undefined) {
        this.alignment = this.serviceInfo.alignment;
        log(
          'TAME library info: No alignment parameter found. Alignment from TPY file is used.',
        );
      } else {
        this.alignment = 1;
        log(
          "TAME library warning: Can't get a value for the data aligment. Default value for alignment is used (1). This works only with TC2 and x86 processors.",
        );
      }
    }

    if (this.alignment !== 1 && this.alignment !== 4 && this.alignment !== 8) {
      log(
        'TAME library warning: The value for the alignment should be 1, 4 or 8.',
      );
    }

    log(
      'TAME library info: Target information: NetId: ' +
        this.service.amsNetId +
        ', AMS port: ' +
        this.service.amsPort +
        ' , alignment: ' +
        this.alignment,
    );
  }

  /**
   *  Prints the symbol table to the console.
   */
  logSymbols() {
    log(this.symTable);
  }

  /**
   *  Prints the data type table to the console.
   */
  logDataTypes() {
    log(this.dataTypeTable);
  }
}
