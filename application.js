// Koch Visio Wrapper
//
// MIT License
// Copyright (c) 2019 René Koch AG
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.


var kochvisio = {
  container: document.getElementById('container'),
  debugger: document.getElementById('debugger'),
  reconnectTimeout: null,
  playing: false,
  socket: null,

  initializePlayer: function(webglMode, withDebugger, width, height) {
    if (!window.player) {
      window.player = new Player({
        workerFile: './vendor/javascripts/decoder.js',
        useWorker: true,
        webgl: webglMode,
        size: {
          width: width,
          height: height
        }
      });

      document.getElementById('container').appendChild(window.player.canvas);

      if (withDebugger) {
        document.getElementById('debugger').style.display = 'block';
        window.visioDebugger = new kochvisio.streamDebugger();
      }
    }
  },

  startStream: function(streamLink, reconnectTimeout) {
    kochvisio.socket = new WebSocket(streamLink);
    kochvisio.socket.binaryType = 'arraybuffer'
    kochvisio.playing = true;

    kochvisio.socket.onopen = function (e) {
      console.log('kochvisio: websocket connected');

      kochvisio.socket.onmessage = function (msg) {
        if (msg.data.replace == undefined) {
          window.player.decode(new Uint8Array(msg.data));
          if(window.visioDebugger) window.visioDebugger.nal(msg.data.byteLength);
        } else {
          if (msg.data == 'invalid.stream') {
            console.log('kochvisio: server returned invalid.stream');
            kochvisio.stopStream();
          }
        }
      }
    }

    kochvisio.socket.onclose = function (e) {
      console.log('kochvisio: websocket disconnected');

      if (kochvisio.playing && reconnectTimeout > 0) {
        kochvisio.reconnectTimeout = setTimeout(function() {
          console.log('kochvisio: reconnecting in ' + reconnectTimeout);
          kochvisio.startStream(streamLink, reconnectTimeout);
        }, reconnectTimeout)
      }

      kochvisio.playing = false;
    }
  },

  stopStream: function() {
    if (kochvisio.socket) kochvisio.socket.close();
    clearTimeout(kochvisio.reconnectTimeout);
    kochvisio.playing = false;
  },

  streamDebugger: function() {
    this.fps = new kochvisio.fpsCalculator(50);
    this.started = +new Date();
    this.last = +new Date();
    this.nals = 0;
    this.total = 0;
    this.frames = 0;
    this.secondTotal = 0;
    this.playerWidth = 0;
    this.playerHeight = 0;

    this.statsElement = document.getElementById('debugger');
    window.player.onPictureDecoded = function(buffer, width, height, infos) {
      window.visioDebugger.frame(width, height);
    }

    this.nal = function(bytes) {
      this.nals++;
      this.total += bytes;
      this.secondTotal += bytes;
    }

    this.frame = function(w, h) {
      this.playerWidth = w;
      this.playerHeight = h;
      this.frames++;
      var now = +new Date(), delta = now - window.visioDebugger.last;
      this.fps.tick(delta);
      this.last = now;
    }

    setInterval(function() {
      var mib = (window.visioDebugger.total/1048576).toFixed(2);
      var date = new Date(null);
      date.setSeconds((+new Date()-window.visioDebugger.started)/1000);
      var dur = date.toISOString().substr(11, 8);
      
      window.visioDebugger.statsElement.innerHTML =
        window.visioDebugger.playerWidth+'x'+window.visioDebugger.playerHeight+', '+
        Math.floor(1/window.visioDebugger.fps.avg()*1000)+' fps, '+
        (window.visioDebugger.secondTotal/1024).toFixed(2)+' KiB/s, total '+mib+' MiB, '+
        window.visioDebugger.nals+' NAL units, '+window.visioDebugger.frames+' frames in '+dur;
      
      window.visioDebugger.secondTotal = 0;
    }, 1000)
  },

  fpsCalculator: function(length) {
    this.length = length;
    this.index = 0;
    this.sum = 0;

    this.buffer = Array.apply(null, Array(length)).map(Number.prototype.valueOf,0);
    
    this.tick = function(tick) {
      this.sum -= this.buffer[this.index];
      this.sum += tick;
      this.buffer[this.index] = tick;
      if (++this.index == this.length) this.index = 0;
      return Math.floor(this.sum/this.length);
    }

    this.avg = function() {
      return Math.floor(this.sum/this.length);
    }

    return this;
  }
}
