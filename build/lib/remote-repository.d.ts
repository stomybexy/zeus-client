/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../../typings/app.d.ts" />
import { Repository } from './repository';
import { Transport } from './transport';
import { Callback } from './common';
export declare class RemoteRepository extends Repository {
    name: string;
    transport: Transport;
    constructor(opts: any);
    onData(data: any, cb?: Callback): void;
    private onAdded(doc, cb);
}
export declare function create(opts: any): RemoteRepository;
