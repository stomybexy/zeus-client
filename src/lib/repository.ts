/// <reference path='../../typings/tsd.d.ts' />
'use strict';

import util = require('util');
import Event = require('events');
import {Callback} from './common';


import _ = require('underscore');

import assert = require('assert');

// var Engine = require('tingodb')()
var safe = require('safe');


export class Repository extends Event.EventEmitter {
    db: any;
    protected ready: boolean;
    protected opts: any;
    protected coll: any;
    constructor(opts: any) {
        super();
        var self = this;
        this.db = opts.db || require('./db');
        this.ready = false;
        this.opts = opts;
        self.on('ready', function() {
            self.ready = true;
        });
        try {
            // self._db = new Engine.Db(self._opts.dbPath, {})
            self.db.collection(self.opts.collName, {},
                safe.sure(function(err: any) {
                    self.emit('error', err);
                }, function(coll: any) {
                    self.coll = coll;
                    self.emit('ready');
                }));
        } catch (err) {
            self.emit('error', err);
        }
    }

    insert(docs: any, options: any, cb: Callback) {
        // body...
        var self = this;
        if (!self.ready) {
            return cb(new Error('collection not ready'));
        }
        self.coll.insert(docs, options, safe.sure(cb, function(docs: any) {
            self.emit('added', docs);
            cb(null, docs);
        }));
        // console.log('I am the insert function')

    }

    update(filter: any, modifier: any, cb: Callback) {
        // body...
        var self = this;
        if (!self.ready) {
            return cb(new Error('collection not ready'));
        }

        if (self.opts.notifyOnUpdate) {

            self.find(filter, safe.sure(cb, function(docsBefore: any) {
                self.coll.update(filter, modifier, safe.sure(cb, function(res: any) {
                    cb(null, res);
                    self.find({
                        _id: {
                            $in: _.pluck(docsBefore, '_id')
                        }
                    }, function(err: any, docsAfter: any) {
                        if (err) {
                            return;
                        }
                        self.emit('modified', docsAfter, docsBefore);
                    });
                }));

            }));
        } else {
            self.coll.update(filter, modifier, cb);
        }


    }

    find(filter: any, cb: Callback) {
        // body...
        var self = this;
        if (!self.ready) {
            return cb(new Error('collection not ready'));
        }
        self.coll.find(filter).toArray(cb);

    }

    findOne(filter: any, cb: Callback) {
        // body...
        var self = this;
        if (!self.ready) {
            return cb(new Error('collection not ready'));
        }
        self.coll.findOne(filter, cb);

    }

    remove(filter: any, cb: Callback) {
        // body...
        var self = this;
        if (!self.ready) {
            return cb(new Error('collection not ready'));
        }
        if (self.opts.notifyOnRemoved) {
            self.find(filter, safe.sure(cb, function(docs: any) {
                self.coll.remove(filter, function(res: any) {
                    // console.log(res)
                    self.emit('removed', docs);
                    cb(null, res);
                });
            }));
        } else {
            self.coll.remove(filter, cb);
        }

    }

}

export function create(opts: any) {
    return new Repository(opts);
}

