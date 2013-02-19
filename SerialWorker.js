var SerialWrapper = SerialWrapper || {};

//Requires
SerialWrapper.Requires = SerialWrapper.Requires || {};
SerialWrapper.Requires.SerialPort = SerialWrapper.Requires.SerialPort || require("serialport");

SerialWrapper.SerialWorker = SerialWrapper.SerialWorker || {};
SerialWrapper.SerialWorker.currentPort = null;
SerialWrapper.SerialWorker.portConnected = false;

//Kills This Process
SerialWrapper.SerialWorker.Shutdown = function() {
    try {
        SerialWrapper.SerialWorker.currentPort.close();
    } catch(err) {

    }
    process.exit(0);
};

//Check for lost IPC
setInterval(function(){
    if(!process.connected)
        SerialWrapper.SerialWorker.Shutdown();
},2000);

process.on("message",function(m){
    if(m.action === "create" && SerialWrapper.SerialWorker.currentPort === null) {
        SerialWrapper.SerialWorker.currentPort = new SerialWrapper.Requires.SerialPort.SerialPort(m.comName,{baudrate:m.baudRate});

        SerialWrapper.SerialWorker.currentPort.on("open",function(){
            SerialWrapper.SerialWorker.portConnected = true;

            try {
                if(process.connected)
                    process.send({action:"open"});
                else
                    SerialWrapper.SerialWorker.Shutdown();
            } catch(err) {

            }
        });

        SerialWrapper.SerialWorker.currentPort.on("data",function(d){

            try {
                var b = new Buffer(d);
                if(process.connected)
                    process.send({action:"data",bufferData:b});
                else
                    SerialWrapper.SerialWorker.Shutdown();
            } catch(err) {

            }
        });

        SerialWrapper.SerialWorker.currentPort.on("error",function(e){
            try {
                if(process.connected)
                    process.send({action:"terminate"});
                SerialWrapper.SerialWorker.Shutdown();
            } catch(err) {

            }
        });

        SerialWrapper.SerialWorker.currentPort.on("end",function(){
            try {
                if(process.connected)
                    process.send({action:"terminate"});
                SerialWrapper.SerialWorker.Shutdown();
            } catch(err) {

            }
        });

        SerialWrapper.SerialWorker.currentPort.on("close",function(){
            try {
                if(process.connected)
                    process.send({action:"terminate"});
                SerialWrapper.SerialWorker.Shutdown();
            } catch(err) {

            }
        });

    }

    if(m.action === "transmit") {
        try {
            if(SerialWrapper.SerialWorker.currentPort !== null)
                SerialWrapper.SerialWorker.currentPort.write(m.message);
        } catch(err) {

        }

    }

    if(m.action === "terminate") {
        try {
            if(process.connected)
                process.send({action:"terminate"});
            SerialWrapper.SerialWorker.Shutdown();
        } catch(err) {

        }
    }
});