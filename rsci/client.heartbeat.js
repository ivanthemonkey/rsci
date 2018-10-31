"use strict"
const debug = require('debug')('RSCI.client.heartbeat')
const state = require('./state')


class heartbeat {
  constructor(uiHeartbeatCommand, serverHeartbeatCommand) {
    this.state = state
    // actions
    this.uiHeartbeatCommand = uiHeartbeatCommand
    this.serverHeartbeatCommand = serverHeartbeatCommand
    // handlers
    this.ui_response = this.ui_response.bind(this)
    this.server_response = this.server_response.bind(this)
  }

  start() {
    debug('start')
    if (this.intervalHandle) clearInterval(this.intervalHandle)
    this.ui = { ts: new Date(1900, 1, 1), response: false }
    this.server = { ts: new Date(1900, 1, 1), response: false }
    this.intervalHandle = setInterval(this._beat.bind(this), this.state.heartbeat_interval)
    this._beat()
  }

  _update() {
    // client
    this.ui.response = new Date() - this.ui.ts <= this.state.heartbeat_interval
    if (this.state.clientUIisAvailable != this.ui.response) {
      debug('clientUIisAvailable ', this.ui.response)
      this.state.clientUIisAvailable = this.ui.response
    }
    this.state.ts_ClientUIisAvailable = new Date()
    // server
    this.server.response = new Date() - this.server.ts <= this.state.heartbeat_interval
    if (this.state.serverisAvailable != this.server.response) {
      debug('serverisAvailable ', this.server.response)
      this.state.serverisAvailable = this.server.response
    }
    this.state.ts_serverisAvailable = new Date()
  }

  _beat() {
    this._update()
    this.uiHeartbeatCommand()
    setTimeout(() => this.serverHeartbeatCommand(
      this.state.server, this.state.me.clientId, 
      this.state.clientUIisAvailable, this.state.ts_ClientUIisAvailable), 1000)
  }

  ui_response() {
    debug('ui_response')
    this.ui.ts = new Date()
    this._update()
  }

  server_response(payload) {
    debug('server_response')
    this.server.ts = new Date()
    this._update()
    debug('server', payload)
  }
}


module.exports = heartbeat

