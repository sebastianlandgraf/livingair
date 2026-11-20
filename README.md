# livingair

This repo enables you to control your brötje livingair central air control unit with javascript/typescript. <br>
It depends on your livingair unit to be connected to the control terminal.

# inspiration
This repo is inspired by different repos like 
- https://github.com/tomcx/tame3
- https://github.com/jisotalo/ads-client

as the main idea of this client was to talk to the living air unit directly. <br>
Unfortunately the twincat protocol relies on a proxy to talk to, which is usualiy a local twincat server. (as far as i understood)

In the end i ended up using the javascript provided by the control terminals webpage and refactored it into a typescript classes.


# Supported Units
I only have my own unit to test with.
- Brötje Livingair LAK300


# Communcation
![image of the livingair unit](./doc/arch-com.drawio.png) 


# Software Architecture

![image of the livingair unit](./doc/arch-sw.drawio.png) 


# Usage LivingAir Client 
```typescript
import {
  LivingAirClient,
  dataPoints,
} from '@sebastianlandgraf/livingAirClient';
const lakIp = '192.168.1.21';
const terminalIp = '192.168.1.22';
const client = new LivingAirClient(terminalIp, lakIp);
await client.writeDatapoint(dataPoints.bAutomaticEnable,1,true)
await client.readDataPoint(dataPoints.eSetpointFanLevel,3,true)
```

# Usage LivingAirService
```typescript
import {FanLevel, LivingAirService} from '@sebastianlandgraf/livingAirService';
const service = new LivingAirService('192.168.1.22','192.168.1.21');
service.fanLevel = FanLevel.AUTO;
```



# TODO
- [ ] add more convinent abstraction of data points
- [ ] add cli for easier usage
- [ ] create snippets for integration in small projects like shelly

In a different repo i would like to add a small webserver which can be used to control the livingair unit via a webinterface.
- [ ] create webserver for livingair unit
- [ ] create a automated schedule with more control points

# Home Assistant integration

This repository also contains a native Home Assistant custom integration in
`custom_components/livingair`. It is separate from the published TypeScript
package and communicates with the unit through the same local TwinCAT SOAP
proxy.

## Install

After a GitHub release containing the integration is available, add this
repository as a custom repository in HACS (Integration category), install
**Brötje Livingair**, and restart Home Assistant. Until that release exists,
download or copy the `custom_components/livingair` directory into your Home
Assistant `config/custom_components/` directory and restart.

In Home Assistant, add the **Brötje Livingair** integration and enter:

- The control terminal host/IP address (HTTP port 80 must be reachable).
- The Livingair unit's IPv4 address.

Setup probes the controller before saving. The integration currently targets
the Brötje Livingair LAK300; other models have not been verified.

## Entities and schedule service

The integration creates a fan entity with discrete **Level 1** through
**Level 4** presets for manual fan control and a separate automatic-mode
switch, supply-air and outdoor-air temperature sensors,
remaining filter time in hours, night-ventilation and occupied switches,
fault binary sensors, and weekday schedule sensors. The schedule sensors
expose their transitions as attributes.

Use the `livingair.set_schedule` service to write up to five transitions to
one or more weekdays. An empty `schedule` clears the selected days. Transitions
must be in increasing time order; `hour` may be 24 only with `minute: 0`.
`level` is the controller's fan level from 0 to 4. Example service data:

```yaml
unit_ip: 192.168.1.21
days:
  - monday
  - tuesday
schedule:
  - hour: 6
    minute: 30
    level: 2
  - hour: 22
    minute: 0
    level: 1
```

The **Get current configuration** button requests an immediate read from the
terminal and refreshes the Home Assistant entities, including the weekday
schedule attributes. The filter reset button sends a reset pulse to the
controller. Polling is local, every 30 seconds. Verify schedule writes, fault
indications, and the filter reset behavior on the target unit before relying
on them; the original library was only exercised against one LAK300.

Before submitting this repository to the HACS default list, publish a release
that includes the integration and keep the manifest version in sync with the
release process.