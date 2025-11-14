import { FindOptionsRelations, ObjectLiteral } from 'typeorm';
export declare function splitIntoBatches<T>(list: T[], maxBatchSize: number): Generator<T[]>;
export declare function copy<T>(obj: T): T;
export declare function mergeRelataions<E extends ObjectLiteral>(a: FindOptionsRelations<E>, b: FindOptionsRelations<E>): FindOptionsRelations<E>;
//# sourceMappingURL=misc.d.ts.map