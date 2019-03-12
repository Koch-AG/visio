# kochvisio
Fork of [Dregu/visio](https://github.com/Dregu/visio). WebAssembly based H.264 baseline decoder and viewer for usage in a browser or webframe. It only supports H.264 baseline and only unwrapped, raw, NAL frames.

### API
#### `kochvisio.initializePlayer(useWorker, webgl, debugger, width, height)`
Initializes the player, this needs to be done once after loading the page.   
Example: `kochvisio.initializePlayer(true, 'auto', true, 640, 480)`   
Params:
* `useWorker` Wether or not to use Web Worker 
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
Testing a stream when using on a server (e.g. node `http-server`)
```
kochvisio.initializePlayer(true, 'auto', true, 640, 480);
kochvisio.startStream('ws://127.0.0.1:3060/socket/test/consumer', 2000);
```

Using in production on mobile
```
// Assuming we're using mobile.html, built by bin/build
// Note that NO webworker is used in this use case!
kochvisio.initializePlayer(false, 'auto', false, 640, 480);
kochvisio.startStream('ws://127.0.0.1:3060/socket/test/consumer', 2000);
```
