"use strict";

const debug = require('debug')('RSCI.API.client');
this.state = require('./state');

this.init = function(clientFunctions,io){
  this.clientFunctions = clientFunctions;
  this.io = io;
}

this.getState  = (req, res) => {
  debug('client_state');
  function doWork(cb){
   this.clientFunctions.getState(cb);
  };

  function cb(data) {
    console.log('result of client response');
    const clientResponse = JSON.stringify(data);
    res.send(clientResponse);
  }
  
  try{
    doWork.bind(this)(cb);
  }catch (ex) {
    debug(ex);
    res.status(500).send('Something broke!')
    return ;
  }
}

this.getStateOne  = (req, res) => {
  debug('client_state');
  function doWork(){

    var output = this.clientFunctions.getState();
    return  JSON.stringify( output);
  };

  var clientResponse = {}

  try{
    clientResponse =  doWork.bind(this)();
  }catch (ex) {
    debug(ex);
    res.status(500).send('Something broke!')
    return ;
  }

  res.send(clientResponse);
}


this.root =  (req, res) => {
  debug('root');

  function doWork(input){
    var output = this.clientFunctions.updateSettings(input);
    return  JSON.stringify( output);
  }

  var clientResponse = {}

  try{
    clientResponse =  doWork.bind(this, req.body)();
  }catch (ex) {
    debug(ex);
    res.status(500).send('Something broke!')
    return;
  }

  res.send(clientResponse);
}


 this.experiment_init = (req, res) => {
  debug('experiment_init_event');

  function doWork(input){
    var output = this.clientFunctions.initExperimentSession(input);
    return  JSON.stringify( output);
  }

  var clientResponse = {}

  try{
    clientResponse =  doWork.bind(this, req.body)();
  }catch (ex) {
    debug(ex);
    res.status(500).send('Something broke!')
    return;
  }

  res.send(clientResponse);
}

this.server_register =  (req, res) => {
  debug('server_register');

  function doWork(input){
    var output = this.clientFunctions.registerServer(input);
      debug('client_server_register post emit');
    var updateNetworkData = {
      server: this.state.server,
      me:this.state.me,
      discoveryList: this.state.discoveryList,
      clientList: this.state.clientList,
    };
    this.io.emit('server_network_event',updateNetworkData )
    
    return  JSON.stringify( output);
  }

  var clientResponse = {}

  try{
    clientResponse =  doWork.bind(this, req.body)();
  }catch (ex) {
    debug(ex);
    res.status(500).send('Something broke!')
    return;
  }

  res.send(clientResponse);
}

this.experiment_stop = (req, res)  => {
  debug('experiment_stop');

  function doWork(input){
    var output = this.clientFunctions.stopExperimentSession(input);

    return  JSON.stringify(output);
  }

  var clientResponse = {}

  try{
    clientResponse =  doWork.bind(this, req.body)();
  }catch (ex) {
    debug(ex);
    res.status(500).send('Something broke!')
    return;
  }

  res.send(clientResponse);

}


module.exports = this;






