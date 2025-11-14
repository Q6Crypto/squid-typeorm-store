import { IsolationLevel, TypeormDatabase, TypeormDatabaseOptions } from '@subsquid/typeorm-store';
import { FinalTxInfo, HotTxInfo, HashAndHeight } from '@subsquid/typeorm-store/lib/interfaces';
import { StoreWithCache } from './store';
export { IsolationLevel, TypeormDatabaseOptions };
export declare class TypeormDatabaseWithCache extends TypeormDatabase {
    transact(info: FinalTxInfo, cb: (store: StoreWithCache) => Promise<void>): Promise<void>;
    transactHot(info: HotTxInfo, cb: (store: StoreWithCache, block: HashAndHeight) => Promise<void>): Promise<void>;
    transactHot2(info: HotTxInfo, cb: (store: StoreWithCache, sliceBeg: number, sliceEnd: number) => Promise<void>): Promise<void>;
    private performUpdates;
    private getCommitOrder;
}
//# sourceMappingURL=database.d.ts.map