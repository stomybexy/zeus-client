'use strict'

const util = require('util')
const EventEmitter = require('events').EventEmitter

var _ = require('underscore')

var assert = require('assert')

// var Engine = require('tingodb')()
var safe = require('safe')

function Repository(opts) {
    var self = this
    EventEmitter.call(self)
    self._ready = false
    self._opts = opts
    self.on("ready", function() {
        self._ready = true
    })


    self._db = self._opts.db || require('./db')


    try {
        // self._db = new Engine.Db(self._opts.dbPath, {})
        self._db.collection(self._opts.collName, {},
            safe.sure(function(err) {
                self.emit('error', err)
            }, function(coll) {
                self._coll = coll
                self.emit('ready')
            }))
    } catch (err) {

        self.emit('error', err)
    }

}
// Inherit functions from `EventEmitter`'s prototype
util.inherits(Repository, EventEmitter)



Repository.prototype.insert = function(docs, options, cb) {
    // body...
    var self = this
    if (!self._ready) {
        return cb(new Error("collection not ready"))
    }
    self._coll.insert(docs, options, safe.sure(cb, function(docs) {
            self.emit('added', docs)
            cb(null, docs)
        }))
        // console.log("I am the insert function")

}

Repository.prototype.update = function(filter, modifier, cb) {
    // body...
    var self = this
    if (!self._ready) {
        return cb(new Error("collection not ready"))
    }

    if (self._opts.notifyOnUpdate) {

        self.find(filter, safe.sure(cb, function(docsBefore) {
            self._coll.update(filter, modifier, safe.sure(cb, function(res) {
                cb(null,res)
                self.find({
                    _id: {
                        $in: _.pluck(docsBefore, '_id')
                    }
                }, function(err, docsAfter) {
                    if (err) {
                        return
                    }
                    self.emit('modified', docsAfter, docsBefore)
                })
            }))

        }))
    } else {
        self._coll.update(filter, modifier, cb)
    }


}

Repository.prototype.find = function(filter, cb) {
    // body...
    var self = this
    if (!self._ready) {
        return cb(new Error("collection not ready"))
    }
    self._coll.find(filter).toArray(cb)

}

Repository.prototype.findOne = function(filter, cb) {
    // body...
    var self = this
    if (!self._ready) {
        return cb(new Error("collection not ready"))
    }
    self._coll.findOne(filter, cb)

}

Repository.prototype.remove = function(filter, cb) {
    // body...
    var self = this
    if (!self._ready) {
        return cb(new Error("collection not ready"))
    }

    if (self._opts.notifyOnRemoved) {
        self.find(filter, safe.sure(cb, function(docs) {
            self._coll.remove(filter, function(res) {
                
                // console.log(res)
                self.emit('removed', docs)
                cb(null, res)
            })
        }))
    } else {
        self._coll.remove(filter, cb)
    }


}





module.exports = {
    create: function(opts) {
        return new Repository(opts)

    },
    getClass: function() {
        return Repository
    }
}
