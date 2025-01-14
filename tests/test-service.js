//import { setTimeout } from 'timers/promises';
import {FanLevel, LivingAirService} from '@sebastianlandgraf/livingair';


const service = new LivingAirService('192.168.1.22','192.168.1.21');


service.fanLevel = FanLevel.HIGH;
service.fanLevel = FanLevel.AUTO;
