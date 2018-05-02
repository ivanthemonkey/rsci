const debug = require('debug')('RSCI.db.experimentSessionsLocal');

const helpers = require('./helpers');

function init(db, provider) {
    this.db = db;

    var schema = new provider.Schema({
        experimentSessionId: String,
        experimentId: String,
        experimentConfig: Object,
        clientId: String,
        sessionStartTime: String,
        actions: Array,
    });

    this.model = provider.model('experimentSessionsLocal', schema);

    function save(data, cb) {
        debug('save');
        model.findOneAndUpdate(
            { experimentSessionId: data.experimentSessionId },
            data,
            { upsert: true, 'new': true },
            function (err, newData) {
                if (err) { debug('error Saving', err); return }
                if (cb){
                    cb(newData);
                }
            }
        );
    }

    function read(experimentSessionId, cb) {
        debug('read');
        model.findOne({ experimentSessionId: experimentSessionId }, function (err, data) {
            if (err) { debug(err); return; }
            cb(data);
            }
        );
    }

    function getList(cb) {
        debug('getList');
        model.find({}, function (err, data) {
            console.log(err, data);
            if (err) { debug(err); return; }
            cb(data);
            }
        );
    };
    
    return {
        read: read,
        save: save,
        getList: getList,
    };
}
module.exports = init;