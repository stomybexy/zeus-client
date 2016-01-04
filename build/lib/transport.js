'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Event = require('events');
var Socket = require('socket.io-client');
var Transport = (function (_super) {
    __extends(Transport, _super);
    function Transport(config) {
        _super.call(this);
        var self = this;
        self.config = config;
        self.socket = Socket(self.config.url);
        self.socket.on('connect', function () {
            self.ready = true;
            self.emit('connect');
        });
        self.socket.on('event', function (data) {
            console.log('event', data);
        });
        self.socket.on('disconnect', function () {
            self.ready = false;
            self.emit('disconnect');
        });
        self.socket.on('reconnect', function () {
            self.ready = true;
            self.emit('reconnect');
        });
    }
    Transport.prototype.send = function (opt, cb) {
        var self = this;
        if (!self.ready) {
            return cb(new Error('Transport not ready'));
        }
        self.socket.emit(opt.channel, opt.data, cb);
    };
    Transport.prototype.register = function (opt) {
        var self = this;
        self.socket.on(opt.eventName, opt.callback);
    };
    Transport.prototype.terminate = function () {
        this.socket.close();
    };
    return Transport;
})(Event.EventEmitter);
exports.Transport = Transport;
function create(config) {
    return new Transport(config);
}
exports.create = create;
