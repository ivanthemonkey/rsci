"use strict";

const debug = require('debug')('RSCI.webApp.');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

this.app= express();

this.server = require('http').Server(this.app);
this.io = require('socket.io')(this.server,{transports: ['polling', 'websocket']});


this.io.on('connection', function (socket) {
  socket.on('client_experiment_onevent', function (data) {
    if (this.externalJobListen) {
      this.externalJobListen(data);
    } else {
      throw ( 'No externalJobListen' );
    }
  }.bind(this));
}.bind(this));


this.getClientCommunicationFunctions = function (listen) {
  debug('getClientCommunicationFunctions');
  this.externalJobListen = listen;
  return {
    start: (data) => { this.io.emit('client_experiment_start', data)},
    stop: (data) => { this.io.emit('client_experiment_stop', data)},
    emitAction: (action) => { this.io.emit('client_experiemnt_action', action)},
  }
};

this.app.use(bodyParser.urlencoded({
  extended: true
}));
this.app.use(bodyParser.json())
this.Objectstate = {};

this.app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});
this.app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  next();

});

this.app.get('/discovery',discovery.bind(this));
this.app.get('/discovery/list',discovery_list.bind(this));
this.app.get('/client/state',client_state.bind(this));
this.app.post('/client/experiment/start',client_experiment_start.bind(this));
this.app.post('/client/experiment/stop',client_experiment_stop.bind(this));
this.app.post('/client/server/register',client_server_register.bind(this));
this.app.post('/server/client/add',server_client_add.bind(this));
this.app.post('/server/register',server_register.bind(this))
this.app.post('/server/experiment/:id/start',server_experiment_start.bind(this));
this.app.post('/server/experiment/:id/session/:sessionId/:clientId/event',server_experiment_id_event.bind(this));



this.init = function(port, props , onUpdateParrentState, clientFunctions, serverFunctions ) {
  this.state = props;
  this.onUpdateParrentState = onUpdateParrentState;
  this.clientFunctions = clientFunctions;
  this.serverFunctions = serverFunctions;
  this.server.listen(port,  '0.0.0.0', function() {
    debug("... Web App up");
  });
};

this.setProps = function(props) {
  debug('setProps ');
  this.state.discoveryList = props.discoveryList;

};

function client_state (req, res)  {
  debug('API:client_state');
  function doWork(){
    var output = this.state;
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

function discovery (req, res)  {
  debug('API:discovery');
  function doWork(){
    var output =    {
      id: this.state.id,
      initTimeStamp: this.state.initTimeStamp
    };
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

function discovery_list (req, res)  {

  debug('API:discovery_list');
  function doWork(){

    var output =    {
      id: this.state.id,
      initTimeStamp: this.state.initTimeStamp,
      discoveryList : this.state.discoveryList
    };
    return  JSON.stringify( output);
  }

  var clientResponse = {}

  try{
    clientResponse =  doWork.bind(this)();
  }catch (ex) {
    debug(ex);
    res.status(500).send('Something broke!')
    return;
  }

  res.send(clientResponse);
}

function client_experiment_start(req, res)  {
  debug('API:client_experiment_start_event');

  function doWork(input){
    var output = this.clientFunctions.startExperimentSession(input);
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

function client_server_register(req, res)  {
  debug('API:client_server_register');

  function doWork(input){
    var output = this.clientFunctions.registerServer(input);
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

function server_experiment_start(req, res)  {
  debug('API:server_experiment_start_event');

  function doWork(input){

    var output = this.serverFunctions.startExperiment(input.experimentId);
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

function server_register(req, res)  {
  debug('API:server_register');

  function doWork(input){
    var output = this.serverFunctions.register();
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


function client_experiment_stop(req, res) {
  res.status(500).send();
}

function server_client_add(req, res)  {
  debug('API:server_client_add');

  function doWork(input){

    var output = this.serverFunctions.addClient(input);
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

function server_experiment_id_event(req, res)  {
  debug('API:server_experiment_id_event');

  var job = {
    id: req.params.id,
    clients:[]
  }
  var knownJob = false;
  for (var i = 0, len = this.state.jobs.length; i < len; i++) {
    if(req.params.id == this.state.jobs[i].id){
      job = this.state.jobs[i];
      knownJob = true;
      break;
    }
  }

  if(!knownJob){
    this.state.jobs.push(job);
  }

  var clients = job.clients;

  var client = {id:req.params.clientId,actions:[]}
  var knownClient = false;
  for (var i = 0, len = clients.length; i < len; i++) {
    if(req.params.clientId == clients[i].id){
      client= clients[i];
      knownClient = true;
      break;
    }
  }
  if(!knownClient){
    clients.push(client);
  }
  var actions = client.actions;
  actions.push(req.body);

  this.onUpdateParrentState(this.state);
  this.io.emit('server_experiment_id_event', req.body);

  res.status(200).send();
}

module.exports = this;






