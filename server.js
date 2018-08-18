var app = require('express')();
var open = require('open');
var serverPort = (4443);
var http = require('http');
var server;
server = http.createServer(app);
var io = require('socket.io')(server);
var sockets = {};
var users = {};

app.get('/', function (req, res) {
    console.log('get /');
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    console.log('user connected');

    socket.on('disconnect', function () {
        console.log('user disconnected');
        if (socket.name) {
            socket.broadcast.to('chatroom').emit('roommessage', { type: "disconnect", username: socket.name })
            delete sockets[socket.name];
            delete users[socket.name];
        }
    })

    socket.on('message', function (message) {
        var data = message;

        switch (data.type) {
            case "login":
                console.log('User logged', data.name);

                // if anyone is logged in with this same username then it will refuse
                if (sockets[data.name]) {
                    socket.send({
                        type: "login",
                        success: false
                    })
                } else {
                    var templist = users;
                    sockets[data.name] = socket;
                    socket.name = data.name;
                    socket.send({
                        type: "login",
                        success: true,
                        username: data.name,
                        userlist: templist
                    });
                    socket.broadcast.to("chatroom").emit('roommessage', { type: "login", username: data.name })
                    socket.join("chatroom");
                    users[data.name] = socket.id;
                }
                break;
            case "call_user":
                if (sockets[data.name]) {
                    console.log("user called");
                    console.log(data.name);
                    console.log(data.callername);
                    sockets[data.name].send({
                        type: "answer",
                        callername: data.callername
                    })
                } else {
                    socket.send({
                        type: "call_response",
                        response: "offline"
                    })
                }
                break;
            case "call_accepted":
                sockets[data.callername].send({
                    type: "call_response",
                    response: "accepted",
                    responsefrom: data.from
                });
                break;
            case "call_rejected":
                sockets[data.callername].send({
                    type: "call_response",
                    response: "rejected",
                    responsefrom: data.from
                });
                break;
            case "call_busy":
                sockets[data.callername].send({
                    type: "call_response",
                    response: "busy",
                    responsefrom: data.from
                })
                break;
            case "message":

            default:
                socket.send({
                    type: 'error',
                    message: 'Command not found: ' + data.type
                })
                break;
        }
    })
})

server.listen(serverPort, function () {
    console.log('server up and running on port ' + serverPort);
})

