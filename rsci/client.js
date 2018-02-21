"use strict";
const debug = require('debug')('RSCI.client');
this.state = require('./state');
const api = require('./api');

const request = require('request-promise');

this.initExperimentSession = function (experimentRequest) {
  debug('initExperimentSession');

  var requestConfig = {
    experimentId: experimentRequest.experimentId,
    instanceId: experimentRequest.instanceId,
    experimentConfig: experimentRequest.experimentConfig,
  };

  requestConfig.experimentConfig.session = eval(experimentRequest.experimentConfig.session);

  this.state.currentExperimentSession = requestConfig;

  function watchEvents(args) {
    sendServerExperimentSessionEvent(args,
      this.state.server.ip,
      this.state.listeningPort,
      this.state.id,
      this.state.currentExperimentSession.experimentId,
      this.state.currentExperimentSession.instanceId);
  }

  var sess = new requestConfig.experimentConfig.session(requestConfig.instanceId, requestConfig.experimentConfig.config);

  sess.on('Init', watchEvents.bind(this));
  sess.on('Dispose', watchEvents.bind(this));
  sess.on('Start', watchEvents.bind(this));
  sess.on('Stop', watchEvents.bind(this));
  sess.on('Event', watchEvents.bind(this));
  sess.on('Action', watchEvents.bind(this));

  var comms = api.getClientCommunicationFunctions(sess.listen);

  comms.init({
    experimentId: requestConfig.experimentId,
    instanceId: requestConfig.instanceId,
    ui: requestConfig.experimentConfig.ui
  });

  sess.init(comms);

  return {
    clientId: this.state.id,
    startDate: new Date(),
    experimentId: experimentRequest.experimentId,
    instanceId: experimentRequest.instanceId,
  };
}

this.registerWithServer = async function (payload, serverip, port) {
  debug('registerWithServer');

  var options = {
    uri: 'http://' + serverip + ':' + port + '/server/client/add',
    json: true,
    method: 'POST',
    body: payload
  };

  try {
    let res = await request(options);
  } catch (e) {

    debug(e);
    debug('Error registering client');
  }

};

this.registerServer = function (payload) {
  debug('registerServer');
  this.state.server = payload;
  this.state.clientList = [];

  var payload = { ip: this.state.me.ip, id: this.state.me.id, initTimeStamp: this.state.me.initTimeStamp }
  this.registerWithServer(payload, this.state.server.ip, this.state.listeningPort);


  return { success: true };
};


async function sendServerExperimentSessionEvent(data, serverip, port, clientId, experimentId, instanceId, ) {
  debug('sendServerExperimentSessionEvent');
  var options = {
    uri: 'http://' + serverip + ':' + port + '/server/experiment/' + experimentId + '/session/' + instanceId + '/' + clientId + '/event',
    json: true,
    method: 'POST',
    body: data
  };

  try {
    let res = await request(options);
  } catch (e) {
    debug('Error sending experiment session event');
  }

}


module.exports = this;

