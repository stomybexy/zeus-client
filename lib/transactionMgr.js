'use strict'

var async = require("async")
var Repository = require('./repository')
	// var sqlite3 = require('sqlite3').verbose()
const util = require('util')
const EventEmitter = require('events').EventEmitter


function TransactionMgr(opts) {
	var self = this
	EventEmitter.call(self)

	self._opts = opts
	self._db = Repository.create({
		collName: opts.collName,
		db: opts.db
	})

	self._db.on('ready', function() {
		self.emit('ready')
	})
	self._db.on('error', function(err) {
		self.emit('error', err)
	})


}
// Inherit functions from `EventEmitter`'s prototype
util.inherits(TransactionMgr, EventEmitter)

TransactionMgr.prototype.onData = function(data, cb) {

}

TransactionMgr.prototype._onDataFunc = function(data, cb) {

	// // Insert data id in table log and insert/update tran table
	// if (!self._ready) {
	// 	return cb({
	// 		code: 500,
	// 		message: "Not ready"
	// 	})
	// }
	// //checking if data exists
	// self.stms.getData.get(data._id, function(err, row) {
	// 	if (row) { //Data already taken into account - everything's fine
	// 		console.log("found data", row)
	// 		return cb()
	// 	}
	// 	//data is to be taken into account
	// 	//Check if transaction with id data.tran_id exists
	// 	self.stms.getTran.get(data.tranId, function(err, res) {
	// 		var tran = res || {
	// 			tran_id: data.tranId,
	// 			data_cnt: data.dataCnt,
	// 			recorded: 0,
	// 			ready: 0
	// 		}
	// 		if (tran.ready === 1) { //transaction's already ready!
	// 			console.log("Transaction already ready!")
	// 			return cb()
	// 		}
	// 		tran.recorded += 1
	// 		if (tran.recorded === tran.data_cnt) {
	// 			tran.ready = 1
	// 		}
	// 		// Create or update tran, data and channels if applicable
	// 		var query = 'BEGIN TRANSACTION; ' + self._queries.updateTran.query
	// 		var params = {
	// 			$tran_id: tran.tran_id,
	// 			$data_cnt: tran.data_cnt,
	// 			$recorded: tran.recorded,
	// 			$ready: tran.ready,
	// 			$data_id: data._id
	// 		}
	// 		if (!res) { //Transaction does not exists! creating channels
	// 			_.each(data.channels, function(ch) {
	// 				var idPh = '$' + ch.name + '_id'
	// 				query += self._queries.insertCh.query.replace(/$ch_id/g, idPh)
	// 				params[idPh] = ch.name
	// 			})
	// 		}
	// 		query += ' COMMIT;'

	// 		self._db.run(query, params, function(err) {
	// 			if (err) {
	// 				console.log("Transaction update failed", tran, err)
	// 				return cb({
	// 					code: 800,
	// 					message: "SQL error",
	// 					err: err
	// 				})
	// 			}
	// 			// Everything's OK
	// 			return cb()
	// 		})

	// 	})
	// })

}

TransactionMgr.prototype._init = function() {
	var self = this
	try {
		console.log("creating tran db")
		self._db = new sqlite3.Database(self._opts.dbPath)
		self._db.exec(self._queries.createSchema.query, function(err) {
			console.log(err)
			if (err) {
				return self.emit('error', {
					code: 300,
					message: 'cannot create database',
					cause: err
				})
			}
			self.emit("ready")

		})


	} catch (err) {
		self._ready = false
		console.log(err)
		self.emit('error', {
			code: 300,
			message: 'cannot create database',
			cause: err
		})
	}
}

module.exports = {
	create: function(opts) {
		return new TransactionMgr(opts)

	},
	getClass: function() {
		return TransactionMgr
	}
}