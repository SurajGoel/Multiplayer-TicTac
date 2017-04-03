/**
 * Created by sgoel01 on 4/2/2017.
 */

var wsServer = require('ws').Server;
var server = require('http').createServer();
var app = require('./app.js');

var wss = new wsServer({
    server: server
});

server.on('request', app);

wss.on('connection', function connection(ws) {
    console.log(ws);
    ws.on('message',function incoming(message) {
        console.log('Received Message from client : ' + message);
        ws.send(JSON.stringify({
            answer : 42
        }));
    })
});

server.listen(8080, function() {
    console.log('Listening on 8080...');
});