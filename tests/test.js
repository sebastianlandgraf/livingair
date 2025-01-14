
import {
  LivingAirClient,
  dataPoints,
} from '@sebastianlandgraf/livingAirClient.js';

const lakIp = '192.168.1.21';
const terminalIp = '192.168.1.22';
const client = new LivingAirClient(terminalIp, lakIp);
await client.writeDatapoint(dataPoints.bAutomaticEnable,1,true)
//await client.readDataPoint(dataPoints.eSetpointFanLevel,3,true)
//client.readDataPoint(dataPoints.rRemainingTimeFilter)
const ret = await client.readDataPoint(dataPoints.aScheduleStandardMonday)
console.log(ret)
