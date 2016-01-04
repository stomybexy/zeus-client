var Db = require('tingodb')().Db;
var mkdirp = require('mkdirp');
mkdirp('./db');
var db = new Db('./db', {});
module.exports = db;
