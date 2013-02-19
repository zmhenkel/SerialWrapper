
var SerialWrapper = require('./serialwrapper');

// --- List Ports ---
function sendTestMessage(comName) {
    var sp = new SerialWrapper.SerialPort(comName,9600);
    sp.on("open",function(){
        console.log("port opened: "+comName);
        sp.sendData(new Buffer(2));
    });

    sp.on("terminate",function(){
        console.log("port terminated: "+comName);
    });

    sp.on("data",function(d){
        console.log(d);
    });

    sp.init();

    setTimeout(function(){
        sp.terminate();
    },2000);
}


SerialWrapper.SerialPort.listPorts(function(err,pts){
    if(err)
        console.log("error: "+err);
    else
        for(var i=0;i<pts.length;i++)
           sendTestMessage(pts[i]);
});