'use strict'

const util = require('util')
const EventEmitter = require('events').EventEmitter

var Socket = require('socket.io-client')

function Transport(config) {
    var self = this
    EventEmitter.call(self)
    self._config = config

    self._socket = Socket(self._config.url)

    self._socket.on('connect', function() {
        // console.log('I am connected to  server')
        self.ready = true
        self.emit('connect')
    })
    self._socket.on('event', function(data) {
        console.log('event', data)
    })
    self._socket.on('disconnect', function() {
        // console.log('I am disconected from server')
        self.ready = false
        self.emit('disconnect')
    })
    self._socket.on('reconnect', function(){
    	self.ready  = true
    	self.emit('reconnect')
    })

}
// Inherit functions from `EventEmitter`'s prototype
util.inherits(Transport, EventEmitter)

Transport.prototype.send = function(data, cb) {
	var self = this
	if(!self.ready){
		return cb(new Error('Transport not ready'))
	}	
	self._socket.emit('data', data, cb)

}

Transport.prototype.register = function(opt) {
	var self = this
	self._socket.on(opt.eventName, opt.callback)
}

module.exports = {
    create: function(config) {
        return new Transport(config)
    }
}
