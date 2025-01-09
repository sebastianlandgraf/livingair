// import http from 'http';
// import xml2js from 'xml2js';
import {
  LivingAirClient,
  dataPoints,
} from '../dist/livingAirClient.js';

const lakIp = '192.168.1.21';
const terminalIp = '192.168.1.22';


const client = new LivingAirClient(terminalIp, lakIp);
client.writeDatapoint(dataPoints.bAutomaticEnable,1,true)
//client.readDataPoint(dataPoints.rRemainingTimeFilter)