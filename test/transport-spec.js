describe("Transport test", function() {

    var Transport = require('../build/lib/transport')
    var safe = require('safe')

    var _ = require('underscore')
    var io
    var port = 3000
    var socket
    beforeAll(function(done) {
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
        done()
    })
    var transport
    var config = {
        url: 'http://localhost:3000'
    }

    it('should connect to the server', function(done) {
        transport = Transport.create(config)

        transport.on('reconnect', function() {
            console.log('transport reconnected')
        })
        transport.on('disconnect', function() {
            console.log('transport disconnected')

        })
        transport.on('connect', done)
    })

    it('should reconnect to the server', function(done) {
        io.close()

        setTimeout(function() {
            io.listen(port)
            setTimeout(function() {
                expect(transport.ready).toBe(true)
                done()
            }, 5000);
        }, 5000);
    }, 20000)

    it('should send data to server', function(done) {
        transport.send({channel: 'data', data: 'hi'}, safe.sure(done.fail, function(res) {
            expect(res).toBe('OK')
            done()
        }))
    })

    it('should register to event from server and send acknowledgement', function(done) {
        transport.register({
            eventName: 'config',
            callback: function(config, cb) {
                // console.log('receiving config from server', config)
                cb(null, 'OK')
                expect(config).toEqual({
                    _id: 1,
                    type: 'ds'
                })
                // done()
            }
        })
        socket.emit('config', {
            _id: 1,
            type: 'ds'
        }, function(err, res){
            // console.log('Ack from client', err, res)
            expect(res).toBe('OK')
            done()
        })

    })

    afterAll(function(done) {
        io.close()
        transport.terminate();
        done()
    })

})
