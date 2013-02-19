/*
    SerialWrapper.js - Wrapper around serialport library.
    Zachary Henkel - serialWrapper@zmhenkel.com
    Free to use without restriction.

    Provides a wrapper around the serialport library which puts each
    serial connection in its own process. Additionally, fixes issues with
    opening ports on OS X and closing ports on OS X.

 */
var SerialWrapper = {};

//Requires
SerialWrapper.Requires = SerialWrapper.Requires || {};
SerialWrapper.Requires.ChildProcess = require("child_process");
SerialWrapper.Requires.Util = require("util");
SerialWrapper.Requires.Events = require("events");
SerialWrapper.Requires.SerialPort = SerialWrapper.Requires.SerialPort || require("serialport");


//Constants
SerialWrapper.Worker = "./SerialWorker.js";

//SerialPort Class
//Events: open, data, close
SerialWrapper.SerialPort = function(comName,baudRate) {
    var self = this;
    var connected = false;
    var childProcess = SerialWrapper.Requires.ChildProcess.fork(SerialWrapper.Worker);
    SerialWrapper.Requires.Events.EventEmitter.call(this);

    childProcess.on("message",function(m){
        if(m.action === "open") {
            connected = true;
            self.emit("open");
        }

        if(m.action === "data") {
            self.emit("data", m.bufferData);
        }

        if(m.action === "terminate") {
            connected = false;
            self.emit("terminate");
        }
    });

    this.init = function(){
        if(childProcess.connected)
            childProcess.send({action:"create",comName:comName,baudRate:baudRate});
    };

    this.sendData = function(data) {
        if(childProcess.connected)
            childProcess.send({action:"transmit",message:data});
    };

    this.terminate = function() {
        if(childProcess.connected)
            childProcess.send({action:"terminate"});
    };
};
SerialWrapper.Requires.Util.inherits(SerialWrapper.SerialPort,SerialWrapper.Requires.Events.EventEmitter);

SerialWrapper.SerialPort.listPorts = function(callback) {
    callback = callback || function (err, ports){};
    if (process.platform !== 'darwin'){
        SerialWrapper.Requires.SerialPort.list(function(err, ports){
            out = [];
            ports.forEach(function(port){
                out.push(port.comName);
            });
            callback(null, out);
        });
        return;
    }

    SerialWrapper.Requires.ChildProcess.exec('ls /dev/tty.*', function(err, stdout, stderr){
        if (err) return callback(err);
        if (stderr !== "") return callback(stderr);
        return callback(null, stdout.split("\n").slice(0,-1));
    });
};

//Export SerialWrapper
module.exports = SerialWrapper;
