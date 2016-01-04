'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Event = require('events');
var _ = require('underscore');
var safe = require('safe');
var Repository = (function (_super) {
    __extends(Repository, _super);
    function Repository(opts) {
        _super.call(this);
        var self = this;
        this.db = opts.db || require('./db');
        this.ready = false;
        this.opts = opts;
        self.on('ready', function () {
            self.ready = true;
        });
        try {
            self.db.collection(self.opts.collName, {}, safe.sure(function (err) {
                self.emit('error', err);
            }, function (coll) {
                self.coll = coll;
                self.emit('ready');
            }));
        }
        catch (err) {
            self.emit('error', err);
        }
    }
    Repository.prototype.insert = function (docs, options, cb) {
        var self = this;
        if (!self.ready) {
            return cb(new Error('collection not ready'));
        }
        self.coll.insert(docs, options, safe.sure(cb, function (docs) {
            self.emit('added', docs);
            cb(null, docs);
        }));
    };
    Repository.prototype.update = function (filter, modifier, cb) {
        var self = this;
        if (!self.ready) {
            return cb(new Error('collection not ready'));
        }
        if (self.opts.notifyOnUpdate) {
            self.find(filter, safe.sure(cb, function (docsBefore) {
                self.coll.update(filter, modifier, safe.sure(cb, function (res) {
                    cb(null, res);
                    self.find({
                        _id: {
                            $in: _.pluck(docsBefore, '_id')
                        }
                    }, function (err, docsAfter) {
                        if (err) {
                            return;
                        }
                        self.emit('modified', docsAfter, docsBefore);
                    });
                }));
            }));
        }
        else {
            self.coll.update(filter, modifier, cb);
        }
    };
    Repository.prototype.find = function (filter, cb) {
        var self = this;
        if (!self.ready) {
            return cb(new Error('collection not ready'));
        }
        self.coll.find(filter).toArray(cb);
    };
    Repository.prototype.findOne = function (filter, cb) {
        var self = this;
        if (!self.ready) {
            return cb(new Error('collection not ready'));
        }
        self.coll.findOne(filter, cb);
    };
    Repository.prototype.remove = function (filter, cb) {
        var self = this;
        if (!self.ready) {
            return cb(new Error('collection not ready'));
        }
        if (self.opts.notifyOnRemoved) {
            self.find(filter, safe.sure(cb, function (docs) {
                self.coll.remove(filter, function (res) {
                    self.emit('removed', docs);
                    cb(null, res);
                });
            }));
        }
        else {
            self.coll.remove(filter, cb);
        }
    };
    return Repository;
})(Event.EventEmitter);
exports.Repository = Repository;
function create(opts) {
    return new Repository(opts);
}
exports.create = create;
