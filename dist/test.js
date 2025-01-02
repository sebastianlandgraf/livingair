import { WebServiceClient } from './WebServiceClient.js';
const service = {
    serviceUrl: 'http://192.168.1.22/script/TcAdsWebService/TcAdsWebService.dll',
    amsNetId: '192.168.1.21.1.1',
    dontFetchSymbols: false,
};
const client = new WebServiceClient(service);
client.logSymbols();
