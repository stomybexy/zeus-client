'use strict'

var async = require("async")
var sqlite3 = require('sqlite3').verbose()
const util = require('util')
const EventEmitter = require('events').EventEmitter


function TransactionMgr(opts) {
	var self = this
	EventEmitter.call(self)
	self._queries = {
		createSchema: {
			query: ' BEGIN TRANSACTION; CREATE TABLE IF NOT EXISTS "tran" ("tran_id" VARCHAR(16) PRIMARY KEY  NOT NULL , "data_cnt" INTEGER NOT NULL , "recorded" INTEGER NOT NULL  DEFAULT 0, ready INTEGER NOT NULL DEFAULT 0); \
CREATE TABLE IF NOT EXISTS "tran_ch" ("id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , "tran_id" VARCHAR(16) NOT NULL , "ch_id" VARCHAR(10) NOT NULL ); \
CREATE TABLE IF NOT EXISTS "tran_data" ("data_id" VARCHAR(16) PRIMARY KEY  NOT NULL , "tran_id" VARCHAR(16) NOT NULL );  COMMIT;'
		},
		getData: {
			query: 'SELECT data_id, tran_id FROM tran_data WHERE data_id = ?'
		},
		getTran: {
			query: 'SELECT tran_id, data_cnt, recorded, ready FROM tran WHERE tran_id = ?'
		},
		updateTran: {
			query: 'INSERT OR REPLACE INTO tran (tran_id, data_cnt, recorded, ready) VALUES ($tran_id, $data_cnt, $recorded, $ready); \
				   INSERT OR REPLACE INTO tran_data (data_id, tran_id) VALUES ($data_id, $tran_id); '
		},
		insertCh: {
			query: 'INSERT INTO tran_ch (tran_id, ch_id) VALUES ($tran_id, $ch_id); '
		}
	}
	self._opts = opts

	self.on('ready', function() {
		try {
			self.stms = {
				getData: self._db.prepare(self._queries.getData.query),
				getTran: self._db.prepare(self._queries.getTran.query)
			}

			self._ready = true
			console.log("tran db is ready")
		} catch (err) {
			console.log("err", err)
			// self._ready = false
			self.emit('error', {
				code: 300,
				message: 'cannot prepare statements',
				cause: err
			})
		}
	})
	self.on('error', function(err) {
		if (err.code === 300) //Database error
		{
			self._ready = false
		}
	})

	setTimeout(self._init.bind(self), 0)

}
// Inherit functions from `EventEmitter`'s prototype
util.inherits(TransactionRepository, EventEmitter)

TransactionRepository.prototype.onData = function(data, cb){
	
}

TransactionRepository.prototype._onDataFunc = function(data, cb) {
	// Insert data id in table log and insert/update tran table
	if (!self._ready) {
		return cb({
			code: 500,
			message: "Not ready"
		})
	}
	//checking if data exists
	self.stms.getData.get(data._id, function(err, row) {
		if (row) { //Data already taken into account - everything's fine
			console.log("found data", row)
			return cb()
		}
		//data is to be taken into account
		//Check if transaction with id data.tran_id exists
		self.stms.getTran.get(data.tranId, function(err, res) {
			var tran = res || {
				tran_id: data.tranId,
				data_cnt: data.dataCnt,
				recorded: 0,
				ready: 0
			}
			if (tran.ready === 1) { //transaction's already ready!
				console.log("Transaction already ready!")
				return cb()
			}
			tran.recorded += 1
			if (tran.recorded === tran.data_cnt) {
				tran.ready = 1
			}
			// Create or update tran, data and channels if applicable
			var query = 'BEGIN TRANSACTION; ' + self._queries.updateTran.query
			var params = {
				$tran_id: tran.tran_id,
				$data_cnt: tran.data_cnt,
				$recorded: tran.recorded,
				$ready: tran.ready,
				$data_id: data._id
			}
			if (!res) { //Transaction does not exists! creating channels
				_.each(data.channels, function(ch) {
					var idPh = '$' + ch.name + '_id'
					query += self._queries.insertCh.query.replace(/$ch_id/g, idPh)
					params[idPh] = ch.name
				})
			}
			query += ' COMMIT;'

			self._db.run(query, params, function(err) {
				if (err) {
					console.log("Transaction update failed", tran, err)
					return cb({
						code: 800,
						message: "SQL error",
						err: err
					})
				}
				// Everything's OK
				return cb()
			})

		})
	})

}

TransactionRepository.prototype._init = function() {
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