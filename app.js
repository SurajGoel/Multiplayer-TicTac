/**
 * Created by sgoel01 on 4/2/2017.
 */
var express = require('express'), bodyParser = require('body-parser');
var app = express();
var path = require('path');
var expressWs = require('express-ws')(app);

var clients = [], remainingToConnect = [], paired = [];
var clientId = 0;

app.use(express.static('public'));
app.use(bodyParser.json());

app.all('/', function (req, res) {
    res.sendFile(path.join(__dirname, './public', 'index.html'));
});

app.ws('/register', function (ws, req) {
    ws.on('message', function (data) {
        data = JSON.parse(data);
        console.log(data);
        var name = data.name;
        if (name != null) {
            var clientObj = new Object();
            clientId++;
            clientObj.conn = ws;
            clientObj.name = name;
            clients.clientId = clientObj;
            remainingToConnect.push(clientId);
            connectclients();
        }
    });
});

app.ws('/play', function (ws, req) {
    ws.on('message', function (data) {
        data = JSON.parse(data);
        var clientid = data.from;
        var value = data.data;
        var receiver = paired.clientid;
        clients.receiver.conn.send(value);
    });
});

app.listen(8080, function (err) {
    if (err) console.log("Error " + err);
    console.log("Listening....");
});


function connectclients() {
    var client1, client2;
    while (remainingToConnect.length > 1) {
        client1 = remainingToConnect.pop();
        client2 = remainingToConnect.pop();
        paired.client1 = client2;
        paired.client2 = client1;
        clients.client1.conn.send(JSON.stringify({
            clientId: client1,
            opposition: clients.client2.name
        }));
        clients.client2.conn.send(JSON.stringify({
            clientId: client2,
            opposition: clients.client1.name
        }));
    }
}