var Db = require('tingodb')().Db
var mkdirp = require('mkdirp')

mkdirp("./db", function(err) {

})
var db = new Db("./db", {})
module.exports = db