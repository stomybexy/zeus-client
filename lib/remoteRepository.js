var async = require("async")
var Repository = require('./repository').getClass()


function RemoteRepository(opts) {
    var self = this
    Repository.call(self, opts)
    self._transport = opts.transport
    self._tranMgr = opts._tranMgr
    if (opts.upsert) {
        self._addedQueue = async.queue(self._onModified.bind(self))
    } else {
        self._addedQueue = async.queue(self._onAdded.bind(self))
    }
    sub = {
        name: opts.collName,
        args: {},
        cb: function(action, res, cb) {
            // console.log(action, res)
            if (action === 'added') {
                // self._onAdded(res.doc, cb)
                self._addedQueue.push(res.doc, cb)
            }
        }
    }
    self._transport.registerRepository(sub, function(err, res) {
        console.log(err, res)
    })
}

RemoteRepository.prototype = Object.create(Repository.prototype)

RemoteRepository.prototype.constructor = RemoteRepository

RemoteRepository.prototype._onAdded = function(doc, cb) {
    var self = this
    async.retry({
        times: 3,
        interval: 1000
    }, function(callback, results) {
        self._addToColl(doc, callback)
    }, function(err, res) {
        if (err) {
            console.log('failed to add doc', doc._id, "pausing the queue", err)
            self._addedQueue.pause()
            cb(err)
            return
        }
        console.log("doc", doc._id, 'added successfuly')
        cb()

    })
}
RemoteRepository.prototype._onModified = function(doc, cb) {
    console.log("doc", doc._id, "modified")
    var self = this
    async.retry({
        times: 3,
        interval: 1000
    }, function(callback, results) {
        self._upsertDoc(doc, callback)
    }, function(err, res) {
        if (err) {
            console.log('failed to update doc', doc._id)
            // self._addedQueue.pause()
            cb(err)
            return
        }
        console.log("doc", doc._id, 'updated successfuly')
        cb()

    })

}
RemoteRepository.prototype._upsertDoc = function(doc, cb) {
    var self = this
    self.findOne({
        _id: doc._id
    }, function(err, d) {
        console.log(err, d)
        if (d) {
            console.log("doc", doc._id, "found. Updating")
            var id = doc._id
                // delete doc._id
            self.update({
                _id: id
            }, doc, function(err, r) {
                if (!err) {
                    console.log("doc updated successfuly")
                }
                cb(err, r)
                return
            })
        } else {
            console.log("doc", doc._id, "not found. Fallback insert")
            return self._addToColl(doc, cb)
        }
    })
}
RemoteRepository.prototype._addToColl = function(doc, cb) {
    var self = this
    self.findOne({
        _id: doc._id
    }, function(err, d) {
        // console.log("error found", err)
        if (d) {
            console.log(d, "exists")
            // self._transport.deliveryReport(doc._id)
            // cb()
            if (self._tranMgr) //Transaction management
            {
                return self._tranMgr.onData(d, cb)

            }

            return cb()
        }

        self.insert(doc, {}, function(err, r) {
            if (!err) {
                console.log("doc", doc, " added successfuly")
                if (self._tranMgr) //Transaction management
                {
                    return self._tranMgr.onData(doc, cb)

                }
                return cb(err, r)

            }

            return cb(err)


        })
    })
}


module.exports = {
    create: function(opts) {
        return new RemoteRepository(opts)

    },
    getClass: function() {
        return RemoteRepository
    }
}