"use strict";

const net = require('net')
const dgram = require('dgram')
const WSServer = require('ws').Server
const Split = require('stream-split')
const NALSeparator = new Buffer([0, 0, 0, 1])
const express = require('express')
const systemd = require('systemd')
const app = express()
var fs = require('fs');

var wstream = fs.createWriteStream('myOutput.h264');

var wsServer, conf = require('nconf'),
  headers = []
conf.argv().defaults({
  tcpport: 8001,
  udpport: 8001,
  wsport: 8081,
  queryport: false,
  limit: 150
})

if (conf.get('queryport')) {
  app.get('/', (req, res) => {
    var count = 0
    wsServer.clients.forEach((ws) => {
      if (ws.readyState == 1) {
        count++
      }
    })
    res.set('Content-type', 'text/plain')
    res.send(count.toString())
  })
  app.listen(conf.get('queryport'))
}

function broadcast(data) {
  wsServer.clients.forEach((ws) => {
    if (ws.readyState === 1) {
      ws.send(data, { binary: true })
    }
  })
}

if (conf.get('tcpport')) {
  const tcpServer = net.createServer((socket) => {
    console.log('streamer connected')
    socket.on('end', () => {
      console.log('streamer disconnected')
    })
    headers = []
    const NALSplitter = new Split(NALSeparator)
    NALSplitter.on('data', (data) => {
      if (wsServer && wsServer.clients.size > 0) {
        if (headers.length < 3) headers.push(data)
        broadcast(data)
      }
    }).on('error', (e) => {
      console.log('splitter error ' + e)
      process.exit(0)
    })
    socket.pipe(NALSplitter)
  })
  tcpServer.listen(conf.get('tcpport'))
  if (conf.get('tcpport') == 'systemd') {
    console.log('TCP server listening on systemd socket')
  } else {
    var address = tcpServer.address()
    if (address) console.log(
      `TCP server listening on ${address.address}:${address.port}`)
  }
}

if (conf.get('udpport')) {
  const udpServer = dgram.createSocket('udp4')
  udpServer.on('listening', () => {
    var address = udpServer.address()
    console.log(
      `UDP server listening on ${address.address}:${address.port}`)
  })
  const NALSplitter = new Split(NALSeparator)
  NALSplitter.on('data', (data) => {
    //console.log(wsServer.clients)
    if (wsServer && wsServer.clients.size > 0) {
      broadcast(data)
    }
  }).on('error', (e) => {
    console.log('splitter error ' + e)
    process.exit(0)
  })
  udpServer.on('message', (msg, rinfo) => {
    NALSplitter.write(msg)
    //broadcast(msg)
    wstream.write(msg);
  })
  udpServer.bind(conf.get('udpport'))
}

if (conf.get('wsport')) {
  wsServer = new WSServer({ port: conf.get('wsport') })
  console.log(
    `WS server listening on`, conf.get('wsport')
  )
  wsServer.on('connection', function connection(ws) {
    console.log('blaa')

    if (wsServer.clients.size >= conf.get('limit')) {
      console.log('client rejected, limit reached')
      ws.close()
      return
    }
    console.log('client connected, watching ' + wsServer.clients.size)
    for (let i in headers) {
      ws.send(headers[i])
    }
    ws.on('close', (ws, id) => {
      console.log('client disconnected, watching ' + wsServer.clients.size)
    })
  })
}