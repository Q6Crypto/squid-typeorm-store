import { EntityMetadata, ObjectLiteral } from 'typeorm';
import { Logger } from '@subsquid/logger';
export declare class CachedEntity<E extends ObjectLiteral = ObjectLiteral> {
    value: E | null;
    constructor(value?: E | null);
}
export declare class CacheMap {
    private opts;
    private map;
    private logger;
    constructor(opts: {
        logger: Logger;
    });
    exist(metadata: EntityMetadata, id: string): boolean;
    get<E extends ObjectLiteral>(metadata: EntityMetadata, id: string): CachedEntity<E> | undefined;
    ensure(metadata: EntityMetadata, id: string): void;
    delete(metadata: EntityMetadata, id: string): void;
    clear(): void;
    add<E extends ObjectLiteral>(metadata: EntityMetadata, entity: E, isNew?: boolean): void;
    values(): Map<EntityMetadata, Map<string, CachedEntity<ObjectLiteral>>>;
    private getEntityCache;
}
//# sourceMappingURL=cacheMap.d.ts.map