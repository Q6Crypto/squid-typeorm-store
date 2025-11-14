import { StoreWithCache } from '../store';
import { Item } from './lib/model';
export declare function createStore(): Promise<StoreWithCache>;
export declare function getItems(store: StoreWithCache): Promise<Item[]>;
export declare function getItemIds(store: StoreWithCache): Promise<string[]>;
//# sourceMappingURL=store.test.d.ts.map