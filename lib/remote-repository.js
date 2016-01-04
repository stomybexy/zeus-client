var safe = require("safe")
var Repository = require('./repository').getClass()


function RemoteRepository(opts) {
    var self = this
    Repository.call(self, opts)
    self.name = opts.name

    self._transport = opts.transport

    self._transport.register({
        eventName: self._opts.name,
        callback: self._onData.bind(self)
    })

}

RemoteRepository.prototype = Object.create(Repository.prototype)

RemoteRepository.prototype.constructor = RemoteRepository

RemoteRepository.prototype._onData = function(data, cb) {
    var self = this
    // console.log('receiving ', self.name, ' event', data)
    if (cb) {
        cb(null, 'OK')
    }
    self.emit('added', data)
}

RemoteRepository.prototype._onAdded = function(doc, cb) {
    var self = this
}




module.exports = {
    create: function(opts) {
        return new RemoteRepository(opts)

    },
    getClass: function() {
        return RemoteRepository
    }
}
