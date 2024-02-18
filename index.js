const fs = require("node:fs")
const path = require("node:path")
const express = require("express")
const expressws = require("express-ws")
const Linsocket = {
    version: "package broken",
    Server: class {
        /**
         * 
         * @param {express.Express} express_server 
         * @param {{ path: string }} configuration 
         */
    
        constructor(express_server, configuration) {
            const wsserver = expressws(express_server);
            configuration = typeof(configuration) == "object" && configuration || typeof(configuration) == 'string' && { path: configuration } || { "path": "/" };
            
            // Socket Variables
            const events = {}
            const sockets = {}
            var globalThis = this
            this.socket = wsserver
    
            // Socket Functions
            this.on = function(event = ("connect" || "connection" || "disconnect" || "disconnection"), callback) {
                // Pre-defined
                if (event == "connection") {
                    event = "connect"
                } else if (event == "disconnection") {
                    event = "disconnect"
                } else if (event == "close") {
                    event = "disconnect"
                }
    
                events[event] = callback
            }
    
            this.disconnectSockets = function() {
                for (var index in sockets) {
                    let socket = sockets[index];
                    // Client Sockets
                    socket.disconnect();
                    delete sockets[index];
                }
            }
    
            wsserver.app.get((configuration.path + "/linsocket.io").split("//").join("/"), (req, res) => {
                return res.end(globalThis.version)
            })
            wsserver.app.ws(configuration.path, (clientsocket, req) => {
                // Pre-events handler
                const clientEvents = {}
                clientsocket.disconnect = clientsocket.close
                
                // Connection + Message Handler
                if (events["connect"]) {
                    let customCS = { ... clientsocket }
                    customCS.headers = req.headers
    
                    // custom emit
                    customCS.emit = function(event, ...message) {
                        if (typeof(event) !== "string") {
                            return false;
                        }
    
                        let packaged = JSON.stringify({
                            method: event.toString(),
                            content: [ ...message ]
                        });
    
                        // Emit packagesto client
                        clientsocket.send(packaged)
                    }
    
                    // custom .on function
                    customCS.on = function(event, callback) {
                        // Pre-defined
                        if (event == "disconnection") {
                            event = "disconnect"
                        } else if (event == "close") {
                            event = "disconnect"
                        }
                        clientEvents[event] = callback
                    }
    
                    // Initialized
                    events["connect"](customCS)    
                }
    
                // Message Handler
                clientsocket.on("message", (message) => {
                    let json;
                    try {
                        json = JSON.parse(message)
                    } catch(err) {
                        return;
                    }
    
                    const { method, content } = json
                    if (!method || typeof(content) !== "object") {
                        return;
                    }
    
                    if (typeof(clientEvents[method]) == "function") {
                        return clientEvents[method](...content)
                    }
                })
    
                sockets[clientsocket] = clientsocket
                // Disconnection Handler
                clientsocket.on("close", () => {
                    delete sockets[clientsocket];
                    let event = clientEvents["disconnect"];
                    if (typeof(event) == "function") {
                        event(clientsocket);
                    }
                })
            })
        }
    }
}

const packageJson = path.join(__dirname, "package.json")
if (fs.existsSync(packageJson)) {
    let json;
    try {
        json = JSON.parse(fs.readFileSync(packageJson, "utf-8"))
    } catch(err) {
        json = {
            name: "linsocket",
            version: "package broken"
        }
    }

    Linsocket.version = json.version || "package broken"
}


module.exports = Linsocket