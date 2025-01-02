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
export type DescriptorArgs = {
    readLength: number;
    items: ItemTyp[];
    seq: boolean;
    calcAlignment: boolean;
    dataObj(jvar: string, data: string | number | boolean | Date | undefined, dataObj: any, prefix: string, suffix: string): unknown;
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
export declare class WebServiceClient {
    private service;
    maxDropReq: number;
    adsState: number | null;
    adsStateTxt: string;
    deviceState: number | null;
    symTable: {
        [index: string]: Symbol;
    };
    symTableOk: boolean;
    dataTypeTable: {
        [index: string]: {
            size: number;
            bitSize: number;
            subItems: {
                [index: string]: Symbol;
            };
        };
    };
    dataTypeTableOk: boolean;
    currReq: number[];
    serviceInfo: {
        alignment: number;
        port: number;
        netId: any;
    };
    symbolCount: number;
    alignment: number;
    xmlHttpReq: any;
    /**
     * The constructor  for the Web Service Client.
     *
     * @param {Object} service  Contains the paramters of the Web Service.
     */
    constructor(service: Service);
    /**
     * The  returns the IndexGroup for a PLC variable address.
     *
     * @param {Object} req          An object with the address or the name for the request.
     * @return {Number} indexGroup  The IndexGroup for the ADS request.
     */
    getIndexGroup(req: {
        addr?: string;
        symbolName?: string;
    }): number | undefined;
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
    }): number | undefined;
    /**
     * The  parses the PLC variable name, looks in the symbol and data type table and
     * returns an object with the necessary information.
     *
     * @param {Object} item          An object with at least the address or the name for the request.
     * @return {Objecct} itemInfo    An object with the information about the item.
     *
     */
    getItemInformation(item: ItemType): ItemInfoType | undefined;
    /**
     * Create the objects for SOAP and XMLHttpRequest and send the request.
     *
     * @param {Object} adsReq   The object containing the arguments of the ADS request.
     */
    createRequest(adsReq: AdsRequest): AdsRequest;
    /**
     * Create a structure definition based on the information in the data table.
     *
     * @param {String}  structname  The name of the structure in the data table.
     * @return {Object} struct      An object containing the items of the structure.
     */
    createStructDef(structname: string): {
        [index: string]: string;
    };
    /**
     * Decode the response string of a Read Request and store the data.
     *
     * @param {Object} adsReq   ADS Reqest Object
     */
    parseReadReq(adsReq: AdsRequest): void;
    /**
     * Decode the response string of a SumReadRequest and store the data.
     *
     * @param {Object} adsReq   ADS Request Object
     */
    parseSumReadReq(adsReq: AdsRequest): void;
    /**
     * Decode the response string of a SumWriteRequest.
     *
     * @param {Object} adsReq   ADS Request Object
     */
    parseSumWriteReq(adsReq: AdsRequest): void;
    /**
     * Decode the response string of a ADS State Request and store the data.
     *
     * @param {Object} adsReq   ADS Reqest Object
     */
    parseAdsState(adsReq: AdsRequest): void;
    /**
     * Create the Request Descriptor for a single variable. An item list
     * with a single array item is generated.
     *
     * @param {String} method   The method, either "Read" or "Write".
     * @param {String} type     The PLC data type.
     * @param {Object} args     The arguments for building for the Request Descriptor.
     */
    createSingleDescriptor(method: string, type: string, args: DescriptorArgs): void;
    /**
     * Create a Request Descriptor for an array. An item list of
     * single variables is generated.
     *
     * @param {String} method   The method, either "Read" or "Write".
     * @param {String} type     The data type of the PLC variable.
     * @param {Object} args     The arguments for building the Request Descriptor.
     */
    createArrayDescriptor(method: string, type: string, args: DescriptorArgs): void;
    /**
     * Create a Request Descriptor for a structure,
     * a structure definition has to be passed as one of the arguments,
     * from wich the item list is created.
     *
     * @param {String} method   The method, either "Read" or "Write".
     * @param {Object} args     The arguments for building the Request Descriptor.
     */
    createStructDescriptor(method: string, args: unknown): void;
    /**
     * This is the  for creating a write request. Depending on the
     * values and PLC data types passed in the variable list a byte array is
     * created and the  for sending the request is called.
     *
     * @param {Object}  reqDescr    The Request Descriptor. Besides other information
     *                              this object contains the allocation of PLC and
     *                              JavaScript variables in an item list.
     */
    writeReq(reqDescr: any): void;
    /**
     * This is the  for creating a read request. If no value for the
     * data length ist passed, calculate the value and then call the
     * for sending the request.
     *
     * @param {Object}  reqDescr    The Request Descriptor. Besides other information
     *                              this object contains the allocation of PLC and
     *                              JavaScript variables in an item list.
     */
    readReq(reqDescr: any): void;
    /**
     * This is the  for creating a sum read request.
     *
     * @param {Object}  reqDescr    The Request Descriptor. Besides other information
     *                              this object contains the allocation of PLC and
     *                              JavaScript variables in an item list.
     */
    sumReadReq(reqDescr: any): void;
    /**
     * This is the  for creating a sum write request.
     *
     * @param {Object}  reqDescr    The Request Descriptor. Besides other information
     *                              this object contains the allocation of PLC and
     *                              JavaScript variables in an item list.
     */
    sumWriteReq(reqDescr: any): void;
    /**
     * This is the  for creating a sum read request.
     *
     * @param {Object}  reqDescr    The Request Descriptor. Besides other information
     *                              this object contains the allocation of PLC and
     *                              JavaScript variables in an item list.
     */
    readAdsState(reqDescr: unknown): void;
    /**
     * Converts the Symbol Table to a JSON string.
     *
     * @return {Array}  jstr    The Symbol Table as a JSON string .
     */
    getSymbolsAsJSON(): string | undefined;
    /**
     * Reads the Symbol Table from a JSON string
     *
     * @param {String}  jstr    A JSON string with the symbols.
     */
    setSymbolsFromJSON(jstr: string): void;
    /**
     * Converts the Data Type Table to a JSON string.
     *
     * @return {Array}  jstr    The Data Type Table as a JSON string .
     */
    getDataTypesAsJSON(): string | undefined;
    /**
     * Reads the Data Type Table from a JSON string
     *
     * @param {String}  jstr    A JSON string with the data types.
     */
    setDataTypesFromJSON(jstr: string): void;
    /**
     * Process the webservice's server response.
     *
     * @param {Object} adsReq   The object containing the arguments of the ADS request.
     */
    parseResponse(adsReq: any): void;
    /**
     * The shortcuts for reading and writing data.
     *
     * @param {Object} args
     */
    writeBool(args: any): void;
    writeByte(args: any): void;
    writeUsint(args: any): void;
    writeSint(args: any): void;
    writeWord(args: any): void;
    writeUint(args: any): void;
    writeInt(args: any): void;
    writeInt1Dp(args: any): void;
    writeDword(args: any): void;
    writeUdint(args: any): void;
    writeDint(args: any): void;
    writeReal(args: any): void;
    writeLreal(args: any): void;
    writeString(args: any): void;
    writeTime(args: any): void;
    writeTod(args: any): void;
    writeDate(args: any): void;
    writeDt(args: any): void;
    readBool(args: any): void;
    readByte(args: any): void;
    readUsint(args: any): void;
    readSint(args: any): void;
    readWord(args: any): void;
    readUint(args: any): void;
    readInt(args: any): void;
    readInt1Dp(args: any): void;
    readDword(args: any): void;
    readUdint(args: any): void;
    readDint(args: any): void;
    readReal(args: any): void;
    readLreal(args: any): void;
    readString(args: any): void;
    readTime(args: any): void;
    readTod(args: any): void;
    readDate(args: any): void;
    readDt(args: any): void;
    writeStruct(args: any): void;
    readStruct(args: any): void;
    writeArrayOfBool(args: any): void;
    writeArrayOfByte(args: any): void;
    writeArrayOfUsint(args: any): void;
    writeArrayOfSint(args: any): void;
    writeArrayOfWord(args: any): void;
    writeArrayOfUint(args: any): void;
    writeArrayOfInt(args: any): void;
    writeArrayOfInt1Dp(args: any): void;
    writeArrayOfDword(args: any): void;
    writeArrayOfUdint(args: any): void;
    writeArrayOfDint(args: any): void;
    writeArrayOfReal(args: any): void;
    writeArrayOfLreal(args: any): void;
    writeArrayOfString(args: any): void;
    writeArrayOfTime(args: any): void;
    writeArrayOfTod(args: any): void;
    writeArrayOfDate(args: any): void;
    writeArrayOfDt(args: any): void;
    writeArrayOfStruct(args: any): void;
    readArrayOfBool(args: any): void;
    readArrayOfByte(args: any): void;
    readArrayOfUsint(args: any): void;
    readArrayOfSint(args: any): void;
    readArrayOfWord(args: any): void;
    readArrayOfUint(args: any): void;
    readArrayOfInt(args: any): void;
    readArrayOfInt1Dp(args: any): void;
    readArrayOfDword(args: any): void;
    readArrayOfUdint(args: any): void;
    readArrayOfDint(args: any): void;
    readArrayOfReal(args: any): void;
    readArrayOfLreal(args: any): void;
    readArrayOfString(args: any): void;
    readArrayOfTime(args: any): void;
    readArrayOfTod(args: any): void;
    readArrayOfDate(args: any): void;
    readArrayOfDt(args: any): void;
    readArrayOfStruct(args: any): void;
    /**
     *  Get the upload info.
     */
    getUploadInfo(): void;
    /**
     * Parse the upload information and call the request for
     * reading the upload data.
     *
     * @param {Object} adsReq   An ADS Request Descriptor.
     */
    parseUploadInfo(adsReq: AdsRequest): void;
    /**
     * Parse the upload data and an object (this.symTable) with the symbol names
     * as the properties.
     *
     * @param {Object} adsReq   An ADS Request Descriptor.
     */
    parseUpload(adsReq: any): void;
    /**
     * Get the symbol-file (*.tpy) from the server and create
     * an object (this.symTable) with the symbol names as the properties.
     */
    getConfigFile(): void;
    /**
     *  Set the service parameter with the values read from the TPY file.
     */
    setServiceParamFromTPY(): void;
    /**
     *  Prints the symbol table to the console.
     */
    logSymbols(): void;
    /**
     *  Prints the data type table to the console.
     */
    logDataTypes(): void;
}
export {};
