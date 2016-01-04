/// <reference path='../../typings/tsd.d.ts' />

var Db = require('tingodb')().Db;
var mkdirp = require('mkdirp');

mkdirp('./db');
var  db = new Db('./db', {});
export = db;
