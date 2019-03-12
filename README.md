# kochvisio
Fork of [Dregu/visio](https://github.com/Dregu/visio). WebAssembly based H.264 baseline decoder and viewer for usage in a browser or webframe.

### API
#### `kochvisio.initializePlayer(decoder, webgl, debugger, width, height)`
Initializes the player, this needs to be done once after loading the page.   
Example: `kochvisio.initializePlayer('auto', true, 640, 480)`   
Params:
* `webgl` WebGL mode that should be used
* `debugger` Whether or not the debugger should run
* `width` Width of the player, should match expected stream
* `height` Height of the player, should match expected stream

#### `kochvisio.startStream(streamLink, reconnectTimeout)`
Start consuming a video strem from the given link.    
Example: `kochvisio.startStream('ws://127.0.0.1:3060/atlas/socket/test/consumer', 2000)`    
Params:
* `streamLink` Link to the stream websocket
* `reconnectTimeout` Timeout for ws reconnect (0=off)

#### `kochVisio.stopStream()`
Stop the running video stream.    
Example: `kochvisio.stopStream()`     

### Example
Testing a stream that is relayed locally by johnson running outside of docker:
```
kochvisio.initializePlayer('auto', true, 640, 480);
kochvisio.startStream('ws://127.0.0.1:3060/atlas/socket/test/consumer', 2000);
```
