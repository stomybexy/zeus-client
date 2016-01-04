/// <reference path="../../typings/tsd.d.ts" />
import Event = require('events');
import { Callback } from './common';
export declare class Repository extends Event.EventEmitter {
    db: any;
    protected ready: boolean;
    protected opts: any;
    protected coll: any;
    constructor(opts: any);
    insert(docs: any, options: any, cb: Callback): any;
    update(filter: any, modifier: any, cb: Callback): any;
    find(filter: any, cb: Callback): any;
    findOne(filter: any, cb: Callback): any;
    remove(filter: any, cb: Callback): any;
}
export declare function create(opts: any): Repository;
