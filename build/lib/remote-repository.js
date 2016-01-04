'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var safe = require('safe');
var repository_1 = require('./repository');
var RemoteRepository = (function (_super) {
    __extends(RemoteRepository, _super);
    function RemoteRepository(opts) {
        _super.call(this, opts);
        var self = this;
        self.name = opts.name;
        self.transport = opts.transport;
        self.transport.register({
            eventName: self.opts.name,
            callback: self.onData.bind(self)
        });
    }
    RemoteRepository.prototype.onData = function (data, cb) {
        var self = this;
        console.log('receiving ', self.name, ' event', data);
        if (cb) {
            cb(null, 'OK');
        }
        self.emit('added', data);
    };
    RemoteRepository.prototype.onAdded = function (doc, cb) {
        var self = this;
    };
    return RemoteRepository;
})(repository_1.Repository);
exports.RemoteRepository = RemoteRepository;
function create(opts) {
    return new RemoteRepository(opts);
}
exports.create = create;
