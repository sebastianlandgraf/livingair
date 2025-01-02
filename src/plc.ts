export const indexGroups: { [index: string]: number } = {
  M: 16416, //PLC memory range(%M field), READ_M - WRITE_M
  MX: 16417, //PLC memory range(%MX field), READ_MX - WRITE_MX
  DB: 16448, //Data range
  I: 61472, //PLC process diagram of the physical inputs(%I field), READ_I - WRITE_I
  IX: 61473, //PLC process diagram of the physical inputs(%IX field), READ_IX - WRITE_IX
  Q: 61488, //PLC process diagram of the physical outputs(%Q field), READ_Q - WRITE_Q
  QX: 61489, //PLC process diagram of the physical outputs(%QX field), READ_QX - WRITE_QX
  Upload: 61451, //Contains the symbol information
  UploadInfo: 61452, //Length and number of the symbol information
  SumRd: 61568, //SumUpReadRequest
  SumWr: 61569, //SumUpWriteRequest
  SumRdWr: 61570, //SumUpReadWriteRequest
};

export const plcTypeLen: { [index: string]: number } = {
  BOOL: 1,
  BYTE: 1,
  USINT: 1,
  SINT: 1,
  WORD: 2,
  UINT: 2,
  INT: 2,
  INT16: 2,
  INT1DP: 2,
  DWORD: 4,
  UDINT: 4,
  DINT: 4,
  TIME: 4, //time base in PLC: milliseconds
  TOD: 4, //time base in PLC: milliseconds
  TIME_OF_DAY: 4, //TwinCAT3, time base in PLC: milliseconds
  DATE: 4, //time base in PLC: seconds
  DT: 4, //time base in PLC: seconds
  DATE_AND_TIME: 4, //TwinCAT3, time base in PLC: seconds
  POINTER: 4,
  REAL: 4,
  LREAL: 8,
  STRING: 80, //without termination
  EndStruct: 0, //should be 0!
};

export const adsStates = [
  'INVALID',
  'IDLE',
  'RESET',
  'INIT',
  'START',
  'RUN',
  'STOP',
  'SAVECFG',
  'POWERGOOD',
  'ERROR',
  'SHUTDOWN',
  'SUSPEND',
  'RESUME',
  'CONFIG',
  'RECONFIG',
];
