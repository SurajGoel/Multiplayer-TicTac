/**
 * Created by sgoel01 on 4/2/2017.
 */
var express = require('express'),
    bodyParser = require('body-parser');
var app = express();
var path = require('path');
var server = require('http').Server(app);
var io = require('socket.io')(server);

var clients = {},
    remainingToConnect = new Set(),
    paired = {},
    sock2client = new WeakMap;
var clientId = 0;

app.use(express.static('public'));
app.use(bodyParser.json());

app.all('/', function(req, res) {
    res.sendFile(path.join(__dirname, './public', 'index.html'));
});

io.on('connection', function(socket) {

    socket.on('disconnect', function() {
        var clientId = sock2client.get(socket);
        var receiver = paired[clientId];
        console.log("Receiver is " + receiver);
        console.log(" ON DISCONNECT BEF paired ");
        console.log(paired);
        console.log(" ON DISC BEF clients ");
        console.log(clients);
        console.log(" ON DISC BEF remaining ");
        console.log(remainingToConnect);
        console.log(" ON DISC BEF sock2client ");
        console.log(sock2client);
        if (receiver != undefined) {
            clients[receiver].conn.emit('close', {});
            delete paired[receiver];
            delete clients[receiver];
            remainingToConnect.delete(receiver);
        }
        delete paired[clientId];
        delete clients[clientId];
        delete sock2client.delete(socket);
        remainingToConnect.delete(clientId);
        console.log(" ON DISCONNECT AFT paired ");
        console.log(paired);
        console.log(" ON DISC AFT clients ");
        console.log(clients);
        console.log(" ON DISC AFT remaining ");
        console.log(remainingToConnect);
        console.log(" ON DISC AFT sock2client ");
        console.log(sock2client);
    });

    socket.on('register', function(data) {
        data = JSON.parse(data);
        console.log(data);
        var name = data.name;
        if (name != null) {
            var clientObj = new Object();
            clientId++;
            clientObj.conn = socket;
            clientObj.name = name;
            clients[clientId] = clientObj;
            remainingToConnect.add(clientId);
            sock2client.set(socket, clientId);
            console.log(sock2client);
            connectclients();
        }
    });

    socket.on('play', function(data) {
        data = JSON.parse(data);
        var clientId = data.clientId;
        var gridPosition = data.data;
        var receiver = paired[clientId];
        console.log("Data sending + ", data);
        clients[receiver].conn.emit('play', JSON.stringify({
            gridPosition: gridPosition
        }));
    });

    socket.on('win', function(data) {
        data = JSON.parse(data);
        var clientId = data.clientId;
        var gridPosition = data.data;
        var receiver = paired[clientId];
        console.log("Data sending + ", data);
        clients[receiver].conn.emit('win', JSON.stringify({
            gridPosition: gridPosition
        }));
    });

    socket.on('draw', function(data) {
        data = JSON.parse(data);
        console.log('Drawwwww !!!!');
        var clientId = data.clientId;
        var gridPosition = data.data;
        var receiver = paired[clientId];
        console.log("Data sending + ", data);
        clients[receiver].conn.emit('draw', JSON.stringify({
            gridPosition: gridPosition
        }));
    })

    socket.on('reset', function(data) {
        var client1 = sock2client.get(socket);
        var client2 = paired[client1];
        sendRegistration(client1, client2);
    });
});

server.listen(8080, function(err) {
    console.log("Listening...");
});

function connectclients() {
    var client1, client2;
    while (remainingToConnect.size > 1) {
        console.log(" ON CONNECT Remaining set before : ");
        console.log(remainingToConnect);
        var clientLoc = getFromSet();
        console.log("ON CONNECT Rem set after ");
        console.log(remainingToConnect);
        client1 = clientLoc[0];
        client2 = clientLoc[1];
        console.log(client1);
        console.log(client2);
        console.log("ON CONNECT Paired obj before : ");
        console.log(paired);
        paired[client1] = client2;
        paired[client2] = client1;
        console.log("ON CONNECT Paired obj after : ");
        console.log(paired);
        sendRegistration(client1, client2);
    }
}

function getFromSet() {
    var arrayClients = [],
        count = 0;
    for (var i of remainingToConnect) {
        arrayClients.push(i);
        count++;
        remainingToConnect.delete(i);
        if (count == 2) break;
    }
    return arrayClients;
}

function sendRegistration(client1, client2) {
    clients[client1].conn.emit('register', JSON.stringify({
        clientId: client1,
        oppositionName: clients[client2].name,
        firstPlayer: 'true',
        myMarker: 'X',
        oppositionMarker: 'O'
    }));
    clients[client2].conn.emit('register', JSON.stringify({
        clientId: client2,
        oppositionName: clients[client1].name,
        firstPlayer: 'false',
        myMarker: 'O',
        oppositionMarker: 'X'
    }));
}
