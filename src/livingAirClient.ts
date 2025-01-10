import {
  DataPointType,
  dataPointTypeType,
  sizes,
  SoapClient,
} from './soapClient.js';

const defaultPort = 800;
const LivingAirIndexGroup = '16416';

export type DatapointName = 'eSetpointFanLevel';

export const dataPoints: { [index: string]: DataPointType } = {
  //Luefterstufe
  eSetpointFanLevel: {
    address: 16786,
    value: 0,
    type: dataPointTypeType.uint,
  },
  bAutomaticEnable: {
    address: 16934,
    value: 0,
    type: dataPointTypeType.int,
  },
  //Startscreen
  rInputTempSensorSup: {
    address: 17286,
    value: 0,
    type: dataPointTypeType.real,
  },

  rInputTempSensorOda: {
    address: 17284,
    value: 0,
    type: dataPointTypeType.real,
  },
  bNightVentEnable: {
    address: 16534,
    value: 0,
    type: dataPointTypeType.int,
  },
  bOccupiedEnable: {
    address: 16941,
    value: 0,
    type: dataPointTypeType.uint,
  },
  uiConnectionCheckCounter: {
    address: 16536,
    value: 0,
    type: dataPointTypeType.uint,
  },
  bPinEnable: {
    address: 16742,
    value: 0,
    type: dataPointTypeType.int,
  },
  //WRG
  bWrgSwitchType: {
    address: 16738,
    value: 0,
    type: dataPointTypeType.int,
  },

  //Meldesystem
  astErrorList_FrostODA: {
    address: 17145,
    value: {},
    type: dataPointTypeType.error,
  },
  astErrorList_TempSUP: {
    address: 17152,
    value: {},
    type: dataPointTypeType.error,
  },
  astErrorList_SensorODA: {
    address: 17159,
    value: {},
    type: dataPointTypeType.error,
  },
  astErrorList_SensorSUP: {
    address: 17166,
    value: {},
    type: dataPointTypeType.error,
  },
  astErrorList_RBGCom: {
    address: 17201,
    value: {},
    type: dataPointTypeType.error,
  },
  astErrorList_DIFirePlace: {
    address: 17208,
    value: {},
    type: dataPointTypeType.error,
  },
  astErrorList_DISmokeDetector: {
    address: 17215,
    value: {},
    type: dataPointTypeType.error,
  },
  astErrorList_DICoverSwitch: {
    address: 17222,
    value: {},
    type: dataPointTypeType.error,
  },
  astErrorList_FilterTime: {
    address: 17229,
    value: {},
    type: dataPointTypeType.error,
  },
  astErrorList_SensorCO2: {
    address: 17180,
    value: {},
    type: dataPointTypeType.error,
  },
  astErrorList_SensorHum: {
    address: 17173,
    value: {},
    type: dataPointTypeType.error,
  },
  bSmokeDetectorEnabled: {
    address: 16385,
    value: 0,
    type: dataPointTypeType.bool,
  },
  bCoverSwitchEnabled: {
    address: 16386,
    value: 0,
    type: dataPointTypeType.bool,
  },
  bFirePlaceEnabled: {
    address: 16387,
    value: 0,
    type: dataPointTypeType.bool,
  },
  //Filterwechsel
  rRemainingTimeFilter: {
    address: 17143,
    value: 0,
    type: dataPointTypeType.real,
  },
  bResetFilterChangeIntervall: {
    address: 16938,
    value: 0,
    type: dataPointTypeType.int,
  },

  rSetpointTempSupOffeset: {
    address: 16789,
    value: 0,
    type: dataPointTypeType.real,
  },

  //Zeitprogramme
  aScheduleStandardMonday: {
    address: 16791,
    value: {},
    type: dataPointTypeType.schaltpunkt,
  },
  aScheduleStandardTuesday: {
    address: 16806,
    value: {},
    type: dataPointTypeType.schaltpunkt,
  },
  aScheduleStandardWednesday: {
    address: 16821,
    value: {},
    type: dataPointTypeType.schaltpunkt,
  },
  aScheduleStandardThursday: {
    address: 16836,
    value: {},
    type: dataPointTypeType.schaltpunkt,
  },
  aScheduleStandardFriday: {
    address: 16851,
    value: {},
    type: dataPointTypeType.schaltpunkt,
  },
  aScheduleStandardSaturday: {
    address: 16866,
    value: {},
    type: dataPointTypeType.schaltpunkt,
  },
  aScheduleStandardSunday: {
    address: 16881,
    value: {},
    type: dataPointTypeType.schaltpunkt,
  },
  aScheduleNightVent1_Hour: {
    address: 16896,
    value: 0,
    type: dataPointTypeType.uint,
  },
  aScheduleNightVent1_Minute: {
    address: 16897,
    value: 0,
    type: dataPointTypeType.uint,
  },
  aScheduleNightVent2_Hour: {
    address: 16898,
    value: 0,
    type: dataPointTypeType.uint,
  },
  aScheduleNightVent2_Minute: {
    address: 16899,
    value: 0,
    type: dataPointTypeType.uint,
  },
  bNightVentAllowed: {
    address: 16739,
    value: 0,
    type: dataPointTypeType.int,
  },
  bSmokeDetectorType: {
    address: 16735,
    value: 0,
    type: dataPointTypeType.int,
  },
  bFirePlaceType: {
    address: 16736,
    value: 0,
    type: dataPointTypeType.int,
  },
  bCoverSwitchType: {
    address: 16734,
    value: 0,
    type: dataPointTypeType.int,
  },
  rSerialNumber: {
    address: 16984,
    value: '',
    type: dataPointTypeType.string,
    length: 16,
  },
  stTime_Year: {
    address: 16924,
    value: -1,
    type: dataPointTypeType.uint,
    loopUpdate: false,
  },
  stTime_Month: {
    address: 16925,
    value: -1,
    type: dataPointTypeType.uint,
    loopUpdate: false,
  },
  stTime_Day: {
    address: 16926,
    value: -1,
    type: dataPointTypeType.uint,
    loopUpdate: false,
  },
  stTime_Hour: {
    address: 16927,
    value: -1,
    type: dataPointTypeType.uint,
    loopUpdate: false,
  },
  stTime_Minute: {
    address: 16928,
    value: -1,
    type: dataPointTypeType.uint,
    loopUpdate: false,
  },
  bGetTimeFromApp: {
    address: 16745,
    value: -1,
    type: dataPointTypeType.uint,
  },
  rControllerVersion: {
    address: 17134,
    value: 1.0,
    type: dataPointTypeType.real,
  },
  eHumState: {
    address: 16537,
    value: 0,
    type: dataPointTypeType.int,
  },
  eCO2State: {
    address: 16538,
    value: 0,
    type: dataPointTypeType.int,
  },
  bCO2ControlActive: {
    address: 16750,
    value: 0,
    type: dataPointTypeType.uint,
  },
  bHumControlActive: {
    address: 16746,
    value: 0,
    type: dataPointTypeType.uint,
  },
  astErrorList_SensorHum_bActive: {
    address: 17173,
    value: 0,
    type: dataPointTypeType.bool,
  },
  astErrorList_SensorCO2_bActive: {
    address: 17180,
    value: 0,
    type: dataPointTypeType.bool,
  },
  astErrorList_FrostODA_bActive: {
    address: 17145,
    value: 0,
    type: dataPointTypeType.bool,
  },
  astErrorList_TempSUP_bActive: {
    address: 17152,
    value: 0,
    type: dataPointTypeType.bool,
  },
  astErrorList_SensorODA_bActive: {
    address: 17159,
    value: 0,
    type: dataPointTypeType.bool,
  },
  astErrorList_SensorSUP_bActive: {
    address: 17166,
    value: 0,
    type: dataPointTypeType.bool,
  },
  astErrorList_RBGCom_bActive: {
    address: 17201,
    value: 0,
    type: dataPointTypeType.bool,
  },
  astErrorList_DIFirePlace_bActive: {
    address: 17208,
    value: 0,
    type: dataPointTypeType.bool,
  },
  astErrorList_DISmokeDetector_bActive: {
    address: 17215,
    value: 0,
    type: dataPointTypeType.bool,
  },
  astErrorList_DICoverSwitch_bActive: {
    address: 17222,
    value: 0,
    type: dataPointTypeType.bool,
  },
  astErrorList_FilterTime_bActive: {
    address: 17229,
    value: 0,
    type: dataPointTypeType.bool,
  },
};

export class LivingAirClient extends SoapClient {
  constructor(terminalIp: string, unitIp: string) {
    super(terminalIp, unitIp + '.1.1', defaultPort);
  }

  convertAddress(address: number): number {
    return 2 * (address - 16384);
  }

  async writeDatapoint(dataPoint: any, value: any, dontReadBack: boolean) {
    const ret = await this.Write(
      LivingAirIndexGroup,
      '' + this.convertAddress(dataPoint.address),
      sizes[dataPoint.type],
      value,
      dataPoint.type,
    );

    await this.processResponse(ret, dataPoint);

    if (!dontReadBack) {
      this.readDataPoint(dataPoint);
    }
  }

  async writeSchaltpunkt(
    day: string,
    type: string,
    point: number,
    value: any,
  ): Promise<any> {
    //Safety net
    const instance = this;

    console.log('write schaltpunkt' + day + 'punkt' + point + type + value);
    if (day == 'alle' || day == 'werktage') {
      setTimeout(function () {
        instance.writeSchaltpunkt('montag', type, point, value);
      }, 0);
      setTimeout(function () {
        instance.writeSchaltpunkt('dienstag', type, point, value);
      }, 200);
      setTimeout(function () {
        instance.writeSchaltpunkt('mittwoch', type, point, value);
      }, 400);
      setTimeout(function () {
        instance.writeSchaltpunkt('donnerstag', type, point, value);
      }, 600);
      setTimeout(function () {
        instance.writeSchaltpunkt('freitag', type, point, value);
      }, 800);

      return;
    }
    let dataPoint = dataPoints.aScheduleStandardMonday;

    if (day == 'montag') {
      dataPoint = dataPoints.aScheduleStandardMonday;
    } else if (day == 'dienstag') {
      dataPoint = dataPoints.aScheduleStandardTuesday;
    } else if (day == 'mittwoch') {
      dataPoint = dataPoints.aScheduleStandardWednesday;
    } else if (day == 'donnerstag') {
      dataPoint = dataPoints.aScheduleStandardThursday;
    } else if (day == 'freitag') {
      dataPoint = dataPoints.aScheduleStandardFriday;
    } else if (day == 'samstag') {
      dataPoint = dataPoints.aScheduleStandardSaturday;
    } else if (day == 'sonntag') {
      dataPoint = dataPoints.aScheduleStandardSunday;
    }

    const baseAddress = this.convertAddress(dataPoint.address);

    let offset = point * 6;

    if (type == 'minute') {
      offset += 2;
    }
    if (type == 'stufe') {
      offset += 4;
    }

    const writeAddress = baseAddress + offset;

    const ret = await this.Write(
      LivingAirIndexGroup,
      '' + writeAddress,
      2,
      value,
      dataPointTypeType.int,
    );

    return this.processResponse(ret, dataPoint);
  }

  readAllDataPoints() {
    const instance = this;
    let delay = 0;
    for (const v in dataPoints) {
      const dataPoint = dataPoints[v];

      if (dataPoint.loopUpdate) {
        console.log(dataPoint);
        setTimeout(
          function (dp) {
            instance.readDataPoint(dp);
          },
          delay,
          dataPoint,
        );
        setTimeout(
          (function (dp) {
            return function () {
              instance.readDataPoint(dp);
            };
          })(dataPoint),
          delay,
        );
        delay += 400;
      }
    }
  }

  async readDataPoint(dataPoint: DataPointType): Promise<any> {
    const ret = await this.Read(
      LivingAirIndexGroup,
      '' + this.convertAddress(dataPoint.address),
      sizes[dataPoint.type],
    );
    return this.processResponse(ret, dataPoint);
  }
}
