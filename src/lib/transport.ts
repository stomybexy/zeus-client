/// <reference path='../../typings/tsd.d.ts' />

'use strict';

import util = require('util');
import Event = require('events');
import Common = require('./common');
import Socket = require('socket.io-client');

export class Transport extends Event.EventEmitter {
    private config: any;
    private socket: SocketIOClient.Socket;
    private ready: boolean;
    constructor(config: any) {
        super();
        var self = this;

        self.config = config;

        self.socket = Socket(self.config.url);

        self.socket.on('connect', function() {
            // console.log('I am connected to  server')
            self.ready = true;
            self.emit('connect');
        });
        self.socket.on('event', function(data: any) {
            console.log('event', data);
        });
        self.socket.on('disconnect', function() {
            // console.log('I am disconected from server')
            self.ready = false;
            self.emit('disconnect');
        });
        self.socket.on('reconnect', function() {
            self.ready = true;
            self.emit('reconnect');
        });
    }

    send(opt: any, cb: Common.Callback) {
        var self = this;
        if (!self.ready) {
            return cb(new Error('Transport not ready'));
        }
        self.socket.emit(opt.channel, opt.data, cb);

    }
    /**
     * Register a callback with a specific event from server
     */
    register(opt: any) {
        var self = this;
        self.socket.on(opt.eventName, opt.callback);
    }

    terminate() {
        this.socket.close();
    }

}


export function create(config: any) {
    return new Transport(config);
}

