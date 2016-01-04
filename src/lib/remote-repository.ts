/// <reference path='../../typings/tsd.d.ts' />
/// <reference path='../../typings/app.d.ts' />

'use strict';
var safe = require('safe');
import {Repository} from './repository';
import {Transport} from './transport';
import {Callback} from './common';


export class RemoteRepository extends Repository {
    name: string;
    transport: Transport;
    constructor(opts: any) {
        super(opts);
        var self = this;
        self.name = opts.name;

        self.transport = opts.transport;

        self.transport.register({
            eventName: self.opts.name,
            callback: self.onData.bind(self)
        });
    }

    onData(data: any, cb?: Callback) {
        var self = this;
        console.log('receiving ', self.name, ' event', data);
        if (cb) {
            cb(null, 'OK');
        }
        self.emit('added', data);
    }

    private onAdded(doc: any, cb: Callback) {
        var self = this;
    }


}

export function create(opts: any) {
    return new RemoteRepository(opts);
}
