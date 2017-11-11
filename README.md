# About
An API server for managing data for lights and groups and sending to subscribers.

![southern-lights-client-logo](https://fooseindustries.com/hosted/southern-lights.jpg)

## Install

## Use

To use, setup the server.  

Provide an options object with a port for the api.

The 'socket_server_url' is the address for the webhook to the socket broadcaster to broadcast to the client.

```js
var server = require('southern_lights_server');

server.createServer({port: 80, socket_url: 'socket_server_url' });
```

## SSL

Create a standard ssl option object and load your key and crt file, ca file is optional.  
Pass the sslOptions object as the ssl property for the server options.

```js
var server = require('southern_lights_server');
var fs = require('fs');

var sslOptions = {
  key: fs.readFileSync('path/to/key/file.key','utf8'),
  crt: fs.readFileSync('path/to/crt/file.crt','utf8')
};

server.createServer({port: 80, socket_url: 'socket_server_url', ssl: sslOptions });
```

## API Server

Get the current running instance of the API Server.

```js
var server = require('southern_lights_server');

var apiServer = server.getServer();
```




