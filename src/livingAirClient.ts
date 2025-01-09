import { DataPointType, sizes, SoapClient } from './soapClient.js';

const defaultPort = 800;
const LivingAirIndexGroup = '16416';

export function convertAddress(address: number): number {
  return 2 * (address - 16384);
}
export type DatapointName = 'eSetpointFanLevel';

export const dataPoints: { [index: string]: DataPointType } = {
  //Luefterstufe
  eSetpointFanLevel: {
    address: 16786,
    value: 0,
    type: 'uint',
  },
  bAutomaticEnable: {
    address: 16934,
    value: 0,
    type: 'int',
  },
  //Startscreen
  rInputTempSensorSup: {
    address: 17286,
    value: 0,
    type: 'real',
  },

  rInputTempSensorOda: {
    address: 17284,
    value: 0,
    type: 'real',
  },
  bNightVentEnable: {
    address: 16534,
    value: 0,
    type: 'int',
  },
  bOccupiedEnable: {
    address: 16941,
    value: 0,
    type: 'uint',
  },
  uiConnectionCheckCounter: {
    address: 16536,
    value: 0,
    type: 'uint',
  },
  bPinEnable: {
    address: 16742,
    value: 0,
    type: 'int',
  },
  //WRG
  bWrgSwitchType: {
    address: 16738,
    value: 0,
    type: 'int',
  },

  //Meldesystem
  astErrorList_FrostODA: {
    address: 17145,
    value: {},
    type: 'error',
  },
  astErrorList_TempSUP: {
    address: 17152,
    value: {},
    type: 'error',
  },
  astErrorList_SensorODA: {
    address: 17159,
    value: {},
    type: 'error',
  },
  astErrorList_SensorSUP: {
    address: 17166,
    value: {},
    type: 'error',
  },
  astErrorList_RBGCom: {
    address: 17201,
    value: {},
    type: 'error',
  },
  astErrorList_DIFirePlace: {
    address: 17208,
    value: {},
    type: 'error',
  },
  astErrorList_DISmokeDetector: {
    address: 17215,
    value: {},
    type: 'error',
  },
  astErrorList_DICoverSwitch: {
    address: 17222,
    value: {},
    type: 'error',
  },
  astErrorList_FilterTime: {
    address: 17229,
    value: {},
    type: 'error',
  },
  astErrorList_SensorCO2: {
    address: 17180,
    value: {},
    type: 'error',
  },
  astErrorList_SensorHum: {
    address: 17173,
    value: {},
    type: 'error',
  },
  bSmokeDetectorEnabled: {
    address: 16385,
    value: 0,
    type: 'bool',
  },
  bCoverSwitchEnabled: {
    address: 16386,
    value: 0,
    type: 'bool',
  },
  bFirePlaceEnabled: {
    address: 16387,
    value: 0,
    type: 'bool',
  },
  //Filterwechsel
  rRemainingTimeFilter: {
    address: 17143,
    value: 0,
    type: 'real',
  },
  bResetFilterChangeIntervall: {
    address: 16938,
    value: 0,
    type: 'int',
  },

  rSetpointTempSupOffeset: {
    address: 16789,
    value: 0,
    type: 'real',
  },

  //Zeitprogramme
  aScheduleStandardMonday: {
    address: 16791,
    value: {},
    type: 'schaltpunkt',
  },
  aScheduleStandardTuesday: {
    address: 16806,
    value: {},
    type: 'schaltpunkt',
  },
  aScheduleStandardWednesday: {
    address: 16821,
    value: {},
    type: 'schaltpunkt',
  },
  aScheduleStandardThursday: {
    address: 16836,
    value: {},
    type: 'schaltpunkt',
  },
  aScheduleStandardFriday: {
    address: 16851,
    value: {},
    type: 'schaltpunkt',
  },
  aScheduleStandardSaturday: {
    address: 16866,
    value: {},
    type: 'schaltpunkt',
  },
  aScheduleStandardSunday: {
    address: 16881,
    value: {},
    type: 'schaltpunkt',
  },
  aScheduleNightVent1_Hour: {
    address: 16896,
    value: 0,
    type: 'uint',
  },
  aScheduleNightVent1_Minute: {
    address: 16897,
    value: 0,
    type: 'uint',
  },
  aScheduleNightVent2_Hour: {
    address: 16898,
    value: 0,
    type: 'uint',
  },
  aScheduleNightVent2_Minute: {
    address: 16899,
    value: 0,
    type: 'uint',
  },
  bNightVentAllowed: {
    address: 16739,
    value: 0,
    type: 'int',
  },
  bSmokeDetectorType: {
    address: 16735,
    value: 0,
    type: 'int',
  },
  bFirePlaceType: {
    address: 16736,
    value: 0,
    type: 'int',
  },
  bCoverSwitchType: {
    address: 16734,
    value: 0,
    type: 'int',
  },
  rSerialNumber: {
    address: 16984,
    value: '',
    type: 'string',
    length: 16,
  },
  stTime_Year: {
    address: 16924,
    value: -1,
    type: 'uint',
    loopUpdate: false,
  },
  stTime_Month: {
    address: 16925,
    value: -1,
    type: 'uint',
    loopUpdate: false,
  },
  stTime_Day: {
    address: 16926,
    value: -1,
    type: 'uint',
    loopUpdate: false,
  },
  stTime_Hour: {
    address: 16927,
    value: -1,
    type: 'uint',
    loopUpdate: false,
  },
  stTime_Minute: {
    address: 16928,
    value: -1,
    type: 'uint',
    loopUpdate: false,
  },
  bGetTimeFromApp: {
    address: 16745,
    value: -1,
    type: 'uint',
  },
  rControllerVersion: {
    address: 17134,
    value: 1.0,
    type: 'real',
  },
  eHumState: {
    address: 16537,
    value: 0,
    type: 'int',
  },
  eCO2State: {
    address: 16538,
    value: 0,
    type: 'int',
  },
  bCO2ControlActive: {
    address: 16750,
    value: 0,
    type: 'uint',
  },
  bHumControlActive: {
    address: 16746,
    value: 0,
    type: 'uint',
  },
  astErrorList_SensorHum_bActive: {
    address: 17173,
    value: 0,
    type: 'bool',
  },
  astErrorList_SensorCO2_bActive: {
    address: 17180,
    value: 0,
    type: 'bool',
  },
  astErrorList_FrostODA_bActive: {
    address: 17145,
    value: 0,
    type: 'bool',
  },
  astErrorList_TempSUP_bActive: {
    address: 17152,
    value: 0,
    type: 'bool',
  },
  astErrorList_SensorODA_bActive: {
    address: 17159,
    value: 0,
    type: 'bool',
  },
  astErrorList_SensorSUP_bActive: {
    address: 17166,
    value: 0,
    type: 'bool',
  },
  astErrorList_RBGCom_bActive: {
    address: 17201,
    value: 0,
    type: 'bool',
  },
  astErrorList_DIFirePlace_bActive: {
    address: 17208,
    value: 0,
    type: 'bool',
  },
  astErrorList_DISmokeDetector_bActive: {
    address: 17215,
    value: 0,
    type: 'bool',
  },
  astErrorList_DICoverSwitch_bActive: {
    address: 17222,
    value: 0,
    type: 'bool',
  },
  astErrorList_FilterTime_bActive: {
    address: 17229,
    value: 0,
    type: 'bool',
  },
};

export class LivingAirClient extends SoapClient {
  constructor(terminalIp: string, netId: string) {
    super(terminalIp, netId, defaultPort);
  }

  writeDatapoint(dataPoint: any, value: any, dontReadBack: boolean) {
    let callback;
    const instance = this;
    if (dontReadBack) {
      callback = function (response: string) {
        instance.processResponse(response, dataPoint);
      };
    } else {
      callback = function (response: string) {
        instance.processResponse(response, dataPoint);
        instance.readDataPoint(dataPoint);
      };
    }

    super.Write(
      LivingAirIndexGroup,
      '' + convertAddress(dataPoint.address),
      sizes[dataPoint.type],
      value,
      dataPoint.type,
      callback,
    );
  }

  writeSchaltpunkt(day: string, type: string, point: number, value: any) {
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
    let baseAddress = 0;

    if (day == 'montag') {
      baseAddress = dataPoints.aScheduleStandardMonday.address;
    } else if (day == 'dienstag') {
      baseAddress = dataPoints.aScheduleStandardTuesday.address;
    } else if (day == 'mittwoch') {
      baseAddress = dataPoints.aScheduleStandardWednesday.address;
    } else if (day == 'donnerstag') {
      baseAddress = dataPoints.aScheduleStandardThursday.address;
    } else if (day == 'freitag') {
      baseAddress = dataPoints.aScheduleStandardFriday.address;
    } else if (day == 'samstag') {
      baseAddress = dataPoints.aScheduleStandardSaturday.address;
    } else if (day == 'sonntag') {
      baseAddress = dataPoints.aScheduleStandardSunday.address;
    }

    baseAddress = convertAddress(baseAddress);

    let offset = point * 6;

    if (type == 'minute') {
      offset += 2;
    }
    if (type == 'stufe') {
      offset += 4;
    }

    const writeAddress = baseAddress + offset;

    const callback = function (_response: string) {
      //instance.processResponse(response, {});
    };
    super.Write(
      LivingAirIndexGroup,
      '' + writeAddress,
      2,
      value,
      'int',
      callback,
    );
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

  readDataPoint(dataPoint: DataPointType) {
    const instance = this;
    const callback = function (response: string) {
      instance.processResponse(response, dataPoint);
    };
    console.log('dp address ' + dataPoint.address);
    console.log('index offset ' + convertAddress(dataPoint.address));
    super.Read(
      LivingAirIndexGroup,
      '' + convertAddress(dataPoint.address),
      sizes[dataPoint.type],
      callback,
    );
    return callback;
  }

  processResponse(response: string, dataPoint: DataPointType) {
    super.processResponse(response, dataPoint);
  }
}
