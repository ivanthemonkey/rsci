const debug = require('debug')('discovery.');
const arpScanner = require('arpscan/promise');
const request = require('request-promise');

this.arpScanner = arpScanner;

this.search = search.bind(this);

async function search (interfaces,port) {

    debug('Port',port);
    var res= [];

    for (var i = 0, len = interfaces.length; i < len; i++) {
        var interface  = interfaces[i];
        debug('  Trying Interface: ' + interface);
        var partResults = [];
        try {
            partResults = await this.arpScanner({ interface: interface, sudo: true });
        }  catch(e) {
            debug('Failed on interface: ' + interface ,e);
        
        }
        res = res.concat(partResults);
    }

    var results =  await findFriends(res,port);
    this.lastSearchResults = results;
    return results;
};

async function findFriends(networkDeviceList,port) {

    debug('Port',port);
    async function callNetworkDevice(networkDevice,port) {
        var options = {
            uri: 'http://' + networkDevice.ip + ':'+port+'/discovery',
            json: true
        };

        debug('Trying: ' + options.uri );

        try {
            let res = await request(options);

            debug('   friend at ' + networkDevice.ip);

            return   {
                ip: networkDevice.ip, 
                id: res.id,
                initTimeStamp: res.initTimeStamp
            };
        } catch(e) {
            debug('no friend at ' + networkDevice.ip);
            return null;
        }
    }


    let friendsList = await Promise.all(networkDeviceList.map(callNetworkDevice,port));

    function cleanFriendLIst(actual) {
        var newArray = new Array();
        for (var i = 0; i < actual.length; i++) {
            if (actual[i]) {
                newArray.push(actual[i]);
            }
        }
        return newArray;
    }

    return cleanFriendLIst(friendsList);  
};

this.findServer= function (networkDeviceList) {
    debug('findServer');
    var output = {};

    var oldestNetworkDevice = null;

    for (var i = 0, len = networkDeviceList.length; i < len; i++) {
        var device =  networkDeviceList [i];
        if( oldestNetworkDevice == null){
            oldestNetworkDevice =  device ;
            continue;  
        }
        if(oldestNetworkDevice.initTimeStamp <  device.initTimeStamp){
            oldestNetworkDevice =  device ;
        }

    }    
    output = oldestNetworkDevice;
    return output;
}



module.exports = this;
