"use strict";
const debug = require('debug')('RSCI.server');
this.state = require('./state');
var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');
const request = require('request-promise');
var discovery = require('./discovery');
var webpackConfig = require('./webpack.conf.js');
const MemoryFS = require("memory-fs");
const webpack = require("webpack");
this.db = require('./db');
const moment = require('moment');

//vue parser

var vuetemplatecompiler = require("vue-template-compiler")

this.startExperiment = async function (inputConfig) {
  debug('startExperiment');
  var experimentId = inputConfig.id;
  var experimentConfig = null;

  for (var i = 0; i < this.state.experiments.configs.length; i++) {
    var config = this.state.experiments.configs[i];
    if (config.config.id.toUpperCase() == experimentId.toUpperCase()) {
      experimentConfig = config;
    }
  }

  if (experimentConfig == null) {
    throw 'Can\'t find experiment ' + experimentId;
  }

  if (!this.state.clientList || this.state.clientList.length < 1) {
    throw 'No clients';
  }

  //copy incoming config
  const cpy = Object.assign(experimentConfig.config, inputConfig);
  experimentConfig.config = cpy;
  var payload = {
    experimentId: experimentId,
    instanceId: helpers.generateId(),
    experimentConfig: experimentConfig,
  };
  var port = this.state.listeningPort;

  async function sendClientInit(client) {
    debug('sendClientInit');

    var options = {
      uri: 'http://' + client.ip + ':' + port + '/client/experiment/init',
      json: true,
      method: 'POST',
      body: payload
    };

    try {
      let res = await request(options);
      return res;
    } catch (e) {
      console.log(e)
      debug('Error sending experiment start event');
    }
    return null;
  }
  let calledClients = await Promise.all(this.state.clientList.map(sendClientInit));


  let newSession = {
    id: payload.instanceId,
    experimentId: experimentId,
    sessionConfig: experimentConfig,
    sessionStartTime: new Date(),
    clients: []
  }

  for (var i = 0; i < experimentConfig.config.clientAssignments.length; i++) {
    let clientAssignment = experimentConfig.config.clientAssignments[i];
    newSession.clients.push({
      clientId: clientAssignment.clientId,
      config: experimentConfig.config,
      actions: [] 
    });
  }
  

  this.state.experimentSessions.push(newSession);

  return {
    clientList: calledClients,
    startDate: new Date(),
    experimentId: experimentId,
    instanceId: payload.instanceId,
  };

};


this.processExperimentSessionEvent = function (sessionId, expId, clientId, data) {

  var session = {
    id: sessionId,
    experimentId: expId,
    clients: []
  }
  var known = false;
  for (var i = 0, len = this.state.experimentSessions.length; i < len; i++) {
    if (sessionId == this.state.experimentSessions[i].id) {
      session = this.state.experimentSessions[i];
      known = true;
      break;
    }
  }

  if (!known) {
    this.state.experimentSessions.push(session);
  }

  var clients = session.clients;

  var client = { clientId: clientId, actions: [] }
  var knownClient = false;
  for (var i = 0, len = clients.length; i < len; i++) {
    if (clientId == clients[i].clientId) {
      client = clients[i];
      knownClient = true;
      break;
    }
  }
  if (!knownClient) {
    clients.push(client);
  }
  var actions = client.actions;
  actions.push(data);

}
function  quoteWrap(val) {
  return '"' + val + '"';
}
this.getExperimentSessionExportAsCsv = function (id) {
  debug('getExperimentSessionExportAsCsv');
  let sessionInfo = [];
  let output = [];
  id = this.state.experimentSessions[0].id;
  for (var i = 0; i < this.state.experimentSessions.length; i++) {
    var experimentSession = this.state.experimentSessions[i]; 
    console.log(experimentSession.id);
// experimentId	experimentName	sessionId	sessionStartTime	clientConfig	clientId	clientAction	clientActionTime
    
    if(id != experimentSession.id) {
      continue;
    }
    console.log('found exp ' + id);
      output.id = id;
      sessionInfo.push(quoteWrap(experimentSession.sessionConfig.config.id));
      sessionInfo.push(quoteWrap(experimentSession.sessionConfig.config.name));
      sessionInfo.push(quoteWrap(experimentSession.sessionConfig.config.version));
      sessionInfo.push(quoteWrap(experimentSession.id));
      sessionInfo.push(quoteWrap(experimentSession.sessionStartTime));
      
      let sessionInfoString = sessionInfo.join(',');


      for (var j = 0; j < experimentSession.clients.length; j++) {
        let clientInfo = [];
        var client = experimentSession.clients[j];
        console.log(client.clientId);
        clientInfo.push(sessionInfoString);
        clientInfo.push(quoteWrap(client.clientId));
        clientInfo.push(quoteWrap('config???'));

        let clientInfoString  = clientInfo.join(','); 
        
        for (var k = 0; k < client.actions.length; k++) {
          
          var action = client.actions[k];
          
          let actionInfo = [];
          actionInfo.push(clientInfoString);
          actionInfo.push(quoteWrap(action.actionType));
          actionInfo.push(quoteWrap(action.actionTimeStamp));

          output.push(actionInfo.join(','));
        }
      }
    }
    console.log(output.join('\n'));
    return output.join('\n');
};

this.getExperimentSessionOverview = function (id){
  debug('getExperimentSessionOverview');
  var output = {};
  for (var i = 0; i < this.state.experimentSessions.length; i++) {
    var experimentSession = this.state.experimentSessions[i]; 

    if(id != experimentSession.id){
      continue;
    }
      output.id = id;
      output.clients = [];
      
      for (var j = 0; j < experimentSession.clients.length; j++) {
        var client = experimentSession.clients[j];
        var action = client.actions[client.actions.length -1];  

        var duration = moment().diff(moment(action.actionTimeStamp),'seconds');
        output.clients.push({
          clientId:client.clientId, 
          lastActionType: action.actionType,
          lastActionTimeStamp:action.actionTimeStamp,
          secondsSinceAction:duration,
        }
      );
      }
  }
  return output ;

};


this.addClient = function (client) {
  debug('addClient');
  var isNewClient = true;

  for (var i = 0; i < this.state.clientList.length; i++) {
    if (this.state.clientList[i].ip === client.ip) {
      isNewClient = false;
    }
  }

  if (isNewClient) {
    this.state.clientList.push(client);
  }

  return this.state.clientList;

};

this.updateClientName = function (oldName,newName) {
  debug('updateClientName');

  for (var i = 0; i < this.state.clientList.length; i++) {
    if (this.state.clientList[i].name === oldName) {
      this.state.clientList[i].name = newName; 
      return true;
    }
  }
  return false;
}

function isClientActive(clientId, activeClientList) {
  for (var i = 0; i < activeClientList.length; i++) {
    if (activeClientList[i].clientId.toUpperCase() === clientId.toUpperCase()) {
      return true;
    }
  }
  return false;
}

this.experimentsList = function () {
  debug('experimentsList');

  var output = [];

  for (var i = 0; i < this.state.experiments.configs.length; i++) {
    var config = JSON.parse(JSON.stringify( this.state.experiments.configs[i].config));
    for (var j = 0; j < config.clientAssignments.length; j++) {
      var ca = config.clientAssignments[j];
       ca.active = isClientActive(ca.clientId, this.state.clientList);
    }
    output.push(config); 
  }

  return output;
};

this.register = function (cb) {
  debug('register');
  this.state.clientList = [];
  this.state.server = this.state.me;
  this.state.isServer = true;

  this.db.settings.save({ isServer: true }, function () { debug('Saved settings') });

  function gotDiscoveryList(discoveryList) {
    debug('gotDiscoveryList');

    this.state.discoveryList = discoveryList;

    let payload = {
      ip: this.state.server.ip,
      clientId: this.state.server.clientId,
      initTimeStamp: this.state.server.initTimeStamp,
    };

    this.sendDiscoveryListNewServer(payload);
    if(cb){cb();}
  }
  function err(e) {
    debug('error getting discovery list', e);
  }

  discovery.search(this.state.cpuInterface, this.state.listeningPort).then(gotDiscoveryList.bind(this));
};

this.sendDiscoveryListNewServer = async function (payload) {
  debug('sendDiscoveryListNewServer');

  var port = this.state.listeningPort;

  async function sendListNewServer(client) {
    debug('sendListNewServer');

    var options = {
      uri: 'http://' + client.ip + ':' + port + '/client/server/register',
      json: true,
      method: 'POST',
      body: payload
    }

    try {
      let res = await request(options);
      return res;

    } catch (e) {
      debug(e);
      debug('Error sending server registration');
    }
    return null;
  }

  let calledClients = await Promise.all(this.state.discoveryList.map(sendListNewServer));

  return {
    clientList: calledClients,
    server: payload
  };

};

function getDirectories(path) {
  return fs.readdirSync(path).filter(function (file) {
    return fs.statSync(path + '/' + file).isDirectory();
  });
}

async function getExperiment(dir, cb) {

  debug('Loading from : ' + dir);
  try {

    debug('Parsing out.....');
    var uistr = fs.readFileSync(path.join(dir, "ui.vue"), "utf8");
    var uiparsed = vuetemplatecompiler.parseComponent(uistr, { pad: true });

    var scripttTransformed = require("babel-core").transform(uiparsed.script.content, {
      minified: false,
      comments: false,
      babelrc: false,
      plugins: ['transform-runtime'],
      presets: ['es2015', 'stage-2'],
    });


    debug('Webpacking.....');


    webpackConfig.context = dir;
    const mfs = new MemoryFS();
    const compiler = webpack(webpackConfig);
    compiler.outputFileSystem = mfs;
    var content = '';
    await compiler.run((err, stats) => {
      debug("complier result");
      content = mfs.readFileSync("//packed.js", "utf8");
      debug('Script len : ' + content.length);
      var ui = {
        template: uiparsed.template.content,
        script: content,
        styles: uiparsed.styles[0].content
      };
      var exp = {
        config: eval(fs.readFileSync(path.join(dir, "config.js"), "utf8")),
        session: fs.readFileSync(path.join(dir, "session.js"), "utf8"),
        ui: ui
      };
      cb(exp);


    });


  } catch (err) {
    console.log(err);
  }

}

this.loadExperiments = function (configDir) {
  debug('loadExperiments');
  debug('Searching : ' + configDir);
  var configs = [];
  var dirs = getDirectories(configDir);
  debug('Found ' + dirs.length + ' experiments ');
  for (var i = 0; i < dirs.length; i++) {
    var dir = path.resolve(path.join(configDir, dirs[i]));
    getExperiment(dir, function (exp) {
      configs.push(exp);
    });
  }

  debug('loadExperiments complete ');
  return configs;
};




this.networkRescan = function (cb) {

  debug('networkRescan');

  function gotDiscoveryList(discoveryList) {
    debug('gotDiscoveryList');

    var rmv = [];
    this.state.discoveryList = discoveryList;
    for(var i =0 ; i< this.state.clientList.length;i++){
      var client = this.state.clientList[i]; 
      var found = false;
      for(var j =0 ; j< this.state.discoveryList.length;j++){
        if (client.ip == this.state.discoveryList[j].ip){
          found = true;
          break;
        }
      }
      if (!found){
          rmv.push(i);
      }
    }
    debug('found '+ rmv.length + ' missing clients')
    for(var i = rmv.length; i > 0; i--){
      this.state.clientList.splice(rmv[i], 1);
    }
    cb();
  }
  function err(e) {
    debug('error getting discovery list', e);
  }

  discovery.search(this.state.cpuInterface, this.state.listeningPort).then(gotDiscoveryList.bind(this));
}

module.exports = this;



