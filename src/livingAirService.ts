import { setTimeout } from 'timers/promises';
import { dataPoints, Days, LivingAirClient } from './livingAirClient.js';
import { daySchaltpunkte, singleSchaltpunkt } from './soapClient.js';

export enum FanLevel {
  AUTO = -1,
  OFF = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  MAX = 4,
}

export class LivingAirService {
  private client: LivingAirClient;
  loop: boolean = false;

  constructor(terminalIp: string, unitIp: string) {
    this.client = new LivingAirClient(terminalIp, unitIp);
  }

  startRefreshing() {
    if (this.loop) {
      return;
    }
    this.loop = true;
    while (this.loop) {
      this.client.readAllDataPoints();
      console.log('Refreshing');
      setTimeout(1000);
    }
  }

  stopRefreshing() {
    this.loop = false;
  }

  get fanLevel(): FanLevel {
    return (dataPoints.bAutomaticEnable.value as boolean)
      ? FanLevel.AUTO
      : dataPoints.eSetpointFanLevel.value;
  }

  set fanLevel(value: FanLevel) {
    if (value !== FanLevel.AUTO) {
      this.client
        .writeDatapoint(dataPoints.bAutomaticEnable, 0, true)
        .then((_result) => {
          this.client.writeDatapoint(
            dataPoints.eSetpointFanLevel,
            value,
            false,
          );
        });
    } else {
      this.client.writeDatapoint(dataPoints.bAutomaticEnable, 1, false);
    }
  }

  get intakeTemperature(): number {
    return dataPoints.rInputTempSensorSup.value;
  }

  get exhaustTemperature(): number {
    return dataPoints.rInputTempSensorOda.value;
  }

  get nightVentEnable(): boolean {
    return dataPoints.bNightVentEnable.value;
  }

  set nightVentEnable(value: boolean) {
    this.client.writeDatapoint(dataPoints.bNightVentEnable, value, false);
  }

  get occupiedEnable(): boolean {
    return dataPoints.bOccupiedEnable.value;
  }

  set occupiedEnable(value: boolean) {
    this.client.writeDatapoint(dataPoints.bOccupiedEnable, value, false);
  }

  get remaningTime(): number {
    return dataPoints.rRemainingTimeFilter.value;
  }

  async setSchaltpunkt(
    day: Days,
    point: number,
    value: singleSchaltpunkt,
  ): Promise<any> {
    await this.client.writeSchaltpunkt(day, 'stunde', point, value.stunde);
    await this.client.writeSchaltpunkt(day, 'minute', point, value.minute);
    return this.client.writeSchaltpunkt(day, 'stufe', point, value.stufe);
  }

  async setFullDaySchaltpunkte(day: Days, value: daySchaltpunkte) {
    await this.setSchaltpunkt(day, 0, value[0]);
    await this.setSchaltpunkt(day, 1, value[1]);
    await this.setSchaltpunkt(day, 2, value[2]);
    await this.setSchaltpunkt(day, 3, value[3]);
    await this.setSchaltpunkt(day, 4, value[4]);
  }
}
