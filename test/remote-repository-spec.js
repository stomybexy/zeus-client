describe("RemoteRepository", function() {

    var Transport = require('../build/lib/transport')
    var RemoteRepository = require('../build/lib/remote-repository')

    var safe = require('safe')
    var assert = require('assert')
    var _ = require('underscore')
    var io
    var port = 3000
    var socket, transport, rr

    beforeAll(function(done) {
        var config = {
            url: 'http://localhost:3000'
        }
        transport = Transport.create(config)

        io = require('socket.io')()
        io.on('connection', function(_socket) {
            socket = _socket
            console.log('A client connected')
            socket.on('data', function(data, cb) {
                // console.log('received', data   , 'from client')
                if (cb) cb(null, 'OK')
            })
        })
        io.listen(port)


        transport.on('connect', done)
    })



    it('should receive <its name> events', function(done) {
        var opts = {
            collName: 'data',
            notifyOnUpdate: true,
            notifyOnRemoved: true,
            transport: transport,
            name: 'data'
        }
        rr = RemoteRepository.create(opts)

        rr.on('added', function(data) {
            assert.deepEqual(data, {
                name: 'test',
                description: 'test description'
            })
            done()
        })

        socket.emit('data', {
            name: 'test',
            description: 'test description'
        })

    })





    afterAll(function(done) {
        io.close()
        done()
    })

})