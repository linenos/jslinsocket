const express = require("express");
const route = express();
const Linsocket = require(".././index");
const server = new Linsocket.Server(route, { path: "/customws" });

// Visit the golang client: https://github.com/linenos/golinsocket

server.on("connect", function(ws) {
    /*
    ws -> {
        disconnect: function(...arguments),
        emit: function(event: string, ...arguments),
        on: function(event: string, callback: function)
        headers: object {
            "host": "host will be here"
            ...
        }
    }
    */

    // Client (golang): server.Emit("login", "example_username", "example_password", "example_otherthing")
    ws.on("login", (username, password, otherthing) => {
        console.log(username) // -> "example_username" / string
        console.log(password) // -> "example_password" / string
        console.log(otherthing) // -> "example_otherthing" / string
    })

    // Check out the golang client: 
    ws.emit("hello", "buirehbgjieruhbgne", "haha", "brrr", "inf arguments", "do NOT send functions in the argument")
    ws.disconnect(); // disconnnect the websocket
})

route.listen(4000, () => {
    console.log("Server Listening on port " + 4000)
})