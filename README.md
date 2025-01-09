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

# TODO
- [ ] add more convinent abstraction of data points
- [ ] add cli for easier usage
- [ ] create snippets for integration in small projects like shelly

In a different repo i would like to add a small webserver which can be used to control the livingair unit via a webinterface.
- [ ] create webserver for livingair unit
- [ ] create a automated schedule with more control points