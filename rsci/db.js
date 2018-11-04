const mongoose = require('mongoose')
const settings = require('./db.settings')
const experimentSessionsLocal = require('./db.experimentSessionsLocal')
const experimentSessionsServer = require('./db.experimentSessionsServer')


class db {
    constructor() {
        mongoose.Promise = global.Promise
        mongoose.connect('mongodb://127.0.0.1/rsci', {useMongoClient:true})
        this.settings = new settings(mongoose)
        this.experimentSessionsLocal = new experimentSessionsLocal(mongoose)
        this.experimentSessionsServer = new experimentSessionsServer(mongoose)
    }
}

module.exports = db;