/// <reference path="../../typings/tsd.d.ts" />
import Event = require('events');
import Common = require('./common');
export declare class Transport extends Event.EventEmitter {
    private config;
    private socket;
    private ready;
    constructor(config: any);
    send(opt: any, cb: Common.Callback): any;
    register(opt: any): void;
}
export declare function create(config: any): Transport;
