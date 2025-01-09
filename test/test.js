// import http from 'http';
// import xml2js from 'xml2js';
import {
  LivingAirClient,
  dataPoints,
} from '../dist/livingAirClient.js';

const lakIp = '192.168.1.21';
const terminalIp = '192.168.1.22';
const netId = lakIp + '.1.1';


const client = new LivingAirClient(terminalIp, netId)
client.writeDatapoint(dataPoints.bAutomaticEnable,1,true)