var Db = require('tingodb')().Db

db = new Db("./db", {})

module.exports = db