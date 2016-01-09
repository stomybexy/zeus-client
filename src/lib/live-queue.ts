/// <reference path='../../typings/tsd.d.ts' />

'use strict';

import _ = require('underscore');
import {Callback} from './common';
import {Repository} from './repository';
import async = require('async');

export class LiveQueue {
    queue: AsyncCargo;
    filter: any;
    payload: number;
    limit: number;
    consumer: any;
    repo: Repository;
    constructor(opts: any, db: Repository) {
        opts = opts || {}
        this.filter = opts.filter || {};
        this.payload = opts.payload || 1;
        this.limit = opts.limit || 10;
        this.consumer = opts.consumer || ((tasks: Array<any>, cb: Callback) => cb());
        this.repo = db;

        this.queue = async.cargo(this.consumer, this.onError, this.payload);
    }
    onError(err: any) {

    }
}