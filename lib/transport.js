var DDPClient = require("ddp")
var _ = require('underscore')
var async = require("async")
    /** Transport class constructor */
var Transport = function(opts) {
    var self = this
    self._opts = opts
    self._ddpclient = new DDPClient(opts)
    self._repositories = {}

}



Transport.prototype.start = function() {
    var self = this
    self._stop = false
    self._ddpclient.connect(onConnected)

    self._ddpclient.on('message', function(msg) {
        // console.log("ddp message: " + msg)
    })

    /*
     * If you need to do something specific on close or errors.
     * You can also disable autoReconnect and
     * call ddpclient.connect() when you are ready to re-connect.
     */
    self._ddpclient.on('socket-close', function(code, message) {
        console.log("Close: %s %s", code, message)
        self.on = false
        if (self._stop) {

            return
        }
        // self._connected = false
        self._startReconnectInterval()

    })

    self._ddpclient.on('socket-error', function(error) {
        console.log("Error: %j", error)
        // keepAlive()
        self.on = false
    })

    function onConnected(error, wasReconnect) {
        self._onConnected(error, wasReconnect)
    }
}
Transport.prototype.stop = function() {
    var self = this
    self._stop = true
    self._stopReconnectInterval()
    self._ddpclient.close()
}

Transport.prototype.registerRepository = function(opts, cb) {
    var self = this

    setTimeout(function() {

        if (self._repositories[opts.name]) {
            return cb({
                code: 500,
                message: 'A repository with the same name is already registered'
            })
        }
        if (!_.isFunction(opts.cb)) {
            return cb({
                code: 500,
                message: 'The listner callback must be a function. Got ' + opts.cb
            })
        }
        var sub = {
            name: opts.name,
            args: opts.args || {},
            cb: opts.cb
        }
        self._repositories[opts.name] = sub

        self._startSubscription(sub)

        return cb(null, {
            code: 200,
            res: sub
        })

    }, 0)

}

Transport.prototype._startSubscriptions = function() {
    var self = this
    console.log("Starting subscriptions")
    // console.log(_.values(self._repositories))
    _.values(self._repositories)
        .forEach(function(sub) {
            self._startSubscription(sub)
        })
}

Transport.prototype._startSubscription = function(sub, cb) {
    var self = this
    if (!self.on)
        return
    setTimeout(function() {
        // if (sub.on) return
        if (!sub.observer) {
            // return
            // Observe collection
            var observer = self._ddpclient.observe(sub.name)
            observer.added = function(id) {
                var doc = self._ddpclient.collections[sub.name][id]
                sub.cb('added', {
                    doc: doc
                }, function(err) {
                    if (err) {
                        console.log("error for doc", err, " re-adding it")
                        setTimeout(function() {
                            observer.added(id)
                        }, 100)
                    } else {
                        console.log("sending delivery report for", doc)
                        self.deliveryReport(sub.name, doc._id)
                    }
                })
            }
            observer.changed = function(id, oldFields, clearedFields, newFields) {
                var doc = self._ddpclient.collections[sub.name][id]
                sub.cb('changed', {
                    doc: doc,
                    oldFields: oldFields,
                    clearedFields: clearedFields,
                    newFields: newFields
                })
            }
            observer.removed = function(id, oldValue) {
                sub.cb('removed', {
                    id: id,
                    oldValue: oldValue
                })
            }
            sub.observer = observer
        }


        self._ddpclient.subscribe(sub.name, [sub.args], function() {
            console.log("Subscription complete", sub.name)
        })


    }, 0)


}

Transport.prototype.deliveryReport = function(collName, docId) {
    var self = this
    self._ddpclient.call('deliveryReport', [{
        collName: collName,
        docId: docId
    }])
}

Transport.prototype._onConnected = function(error, wasReconnect) {
    var self = this
    console.log('Running on connected')
    self.on = true
    // If autoReconnect is true, this callback will be invoked each time 
    // a server connection is re-established 
    // console.log(self._opts)
    // self._stopReconnectInterval()
    if (error) {
        console.log('DDP connection error!');
        return;
    }

    if (wasReconnect) {
        console.log('Reestablishment of a connection.')

    }

    console.log('connected! running onConnected callback')
    self._startSubscriptions()

}
Transport.prototype._startReconnectInterval = function() {
    var self = this
    console.log("Trying reconnection...")
    setTimeout(function() {
        self._ddpclient.connect()
    }, self._opts.reconnectInterval || 20000)

    // async.doWhilst(function(cb) {
    //     console.log("Trying reconnection...")
    //         self._ddpclient.connect()
    //         setTimeout(cb, self._opts.reconnectInterval || 20000)

    //     }, function(callback) {
    //         return self.on
    //     }, function(err, res) {
    //         console.log(err, res)
    //     })
    // console.log("Starting reconnect interval")
    // var reconnectIntervalId = setInterval(function() {
    //     console.log("running reconnect intervall.....")
    //     self._ddpclient.connect()
    // }, self._opts.reconnectInterval || 20000)
    // console.log("Started reconnectInterval with id")
    // return reconnectIntervalId
}
Transport.prototype._stopReconnectInterval = function() {
    var self = this
    console.log("Trying to stop reconnect interval with id")
    if (self._reconnectIntervalId) {
        console.log("Stopping reconnect interval")
        clearInterval(self._reconnectIntervalId)
        self._reconnectIntervalId = null
    }
}



module.exports = {
    createTransport: function(opts) {
        return new Transport(opts)
    }
}