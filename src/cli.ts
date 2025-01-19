#!/usr/bin/env node
import commandLineArgs from 'command-line-args';
import { FanLevel, LivingAirService } from './livingAirService.js';

type cliOptions = {
  terminal: string;
  unit: string;
  mode: string;
  parameter: string;
  value?: number;
};

const optionDefinitions = [
  { name: 'terminal', alias: 't', type: String },
  { name: 'unit', alias: 'u', type: String },
  { name: 'mode', alias: 'm', type: String },
  { name: 'parameter', alias: 'p', type: String },
  { name: 'value', alias: 'v', type: Number, optional: true },
];

const options = commandLineArgs(optionDefinitions) as cliOptions;

console.log(options);

const service = new LivingAirService(options.terminal, options.unit);

await service.refresh();

switch (options.mode) {
  case 'get':
    console.log(service.fanLevel);
    break;
  case 'set':
    service.fanLevel = options.value as FanLevel;
    break;
  default:
    console.log('command not found');
}
