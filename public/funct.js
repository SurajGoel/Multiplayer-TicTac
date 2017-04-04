/**
 * Created by sgoel01 on 4/2/2017.
 */

'use strict';

var socket_register, socket_play,myId,oppositionName;
var namePlayer,nameSubmit;

$(document).ready(function () {

    /* var socket = new WebSocket('ws://192.168.43.187:8080'); */
    namePlayer = $('#namePlayer');
    nameSubmit = $('#nameSubmit');
    nameSubmit.on('click', function () {

        socket_register = new WebSocket('ws://192.168.43.187:8080/register');

        socket_register.onopen = function () {
            $('#sub-head').val("Waiting for Player to join");
            namePlayer.hide(); nameSubmit.hide();
            socket_register.send(JSON.stringify({
                name: namePlayer.val()
            }));
            socket_register.onmessage = function (data) {
                data = JSON.parse(data);
                myId = data.clientId;
                oppositionName = data.opposition;
                socket_play = new WebSocket("ws://192.168.43.187:8080/play");
                $('#sub-head').val("Playing with " + oppositionName);
                namePlayer.attr("placeholder", "Send value to Oppoition");
                nameSubmit.on('click', sendPlay());
                socket_play.onmessage = onMessagePlay(data);
            }
        }

    });



});


function sendPlay() {
    socket_play.send(JSON.stringify({
        from : myId,
        data : namePlayer.val()
    }));
    namePlayer.val("");
}

function onMessagePlay(data) {
    $('#textincoming').val(data);
}
/* $(document).ready(function () {

 function socketExample() {
 console.log("Creating Socket");
 var socket = new WebSocket('ws://192.168.43.187:8080');
 socket.onopen = function () {
 console.log("Socket is Open");
 socket.send(JSON.stringify({
 message: "I Don't wanna live forever"
 }));
 console.log("Message Sent from client side");
 };
 socket.onmessage = function (message) {
 console.log("Message coming from server to client is : ", message.data);
 var data = JSON.parse(message.data);
 document.getElementById('response').innerHTML = JSON.stringify(data, null, 2);
 };
 }

 function postExample() {
 $.ajax({
 type: 'POST',
 url: 'http://192.168.43.187:8080',
 data: {
 message: "This is post message from client"
 },
 success: function (data) {
 document.getElementById('post-response').innerHTML = JSON.stringify(data, null, 2);
 },
 error: function () {
 console.log(" Error from server side to client");
 }
 })
 }
 console.log("Atleast Working.... ?");
 //socketExample();
 //postExample();
 }); */