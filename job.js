"use strict";

var ee = require('event-emitter');

var base  = class base {
    constructor(jobId) {
        this.id = jobId;
        this.start = function(clientCommunicationFunctions) {
          this.uiCalls = clientCommunicationFunctions;
          this.state = {};
            this.emit('Start', {eventTimeStamp:new Date(), eventType:'Start' } );
            this.uiCalls.start({ id: this.id });

            setTimeout(() => {
                this.emit('Stop', {eventTimeStamp:new Date(), eventType:'Stop' } );
                this.uiCalls.stop({ id: this.id });
            }, 30000);
        };

      this.listen = function(event) {
            this.emit('Action', {eventTimeStamp:new Date(), eventType: event.type }  ); 
            this.state[event.type]++;
        
            if (event.type === 'btn_blue_onClick') {
                this.emit('Action', {eventTimeStamp:new Date(), eventType:'Flash' } );

                this.uiCalls.emitAction({ type: 'Flash' });
            }


        }.bind(this);
    };

};

ee(base.prototype); 


module.exports = base;

