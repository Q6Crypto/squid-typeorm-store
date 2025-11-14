import { Entity, EntityClass, FindManyOptions as FindManyOptions_, FindOneOptions as FindOneOptions_, Store } from "@subsquid/typeorm-store";
import { ChangeTracker } from "@subsquid/typeorm-store/lib/hot";
import { EntityManager, EntityMetadata, EntityTarget, FindOptionsRelations, FindOptionsWhere, ObjectLiteral } from "typeorm";
export { Entity, EntityClass };
export interface EntityType extends ObjectLiteral {
    id: string;
}
export type ChangeSet = {
    metadata: EntityMetadata;
    inserts: EntityType[];
    upserts: EntityType[];
    removes: string[];
    extraUpserts: EntityType[];
};
export interface GetOptions<E = any> {
    id: string;
    relations?: FindOptionsRelations<E>;
}
export interface FindOneOptions<E> extends FindOneOptions_<E> {
    cache?: boolean;
}
export interface FindManyOptions<E> extends FindManyOptions_<E> {
    cache?: boolean;
}
export declare class StoreWithCache extends Store {
    private em;
    private commitOrder;
    private updates;
    private defers;
    private cache;
    private logger;
    private currentCommit;
    private currentLoad;
    constructor(em: () => EntityManager, opts: {
        changeTracker?: ChangeTracker;
        commitOrder: EntityMetadata[];
    });
    insert<E extends EntityType>(entity: E): Promise<void>;
    insert<E extends EntityType>(entities: E[]): Promise<void>;
    upsert<E extends EntityType>(entity: E): Promise<void>;
    upsert<E extends EntityType>(entities: E[]): Promise<void>;
    save<E extends EntityType>(entity: E): Promise<void>;
    save<E extends EntityType>(entities: E[]): Promise<void>;
    remove<E extends EntityType>(entity: E): Promise<void>;
    remove<E extends EntityType>(entities: E[]): Promise<void>;
    remove<E extends EntityType>(entityClass: EntityTarget<E>, id: string | string[]): Promise<void>;
    count<E extends EntityType>(entityClass: EntityTarget<E>, options?: FindManyOptions<E>): Promise<number>;
    countBy<E extends EntityType>(entityClass: EntityTarget<E>, where: FindOptionsWhere<E> | FindOptionsWhere<E>[]): Promise<number>;
    find<E extends EntityType>(entityClass: EntityTarget<E>, options: FindManyOptions<E>): Promise<E[]>;
    findBy<E extends EntityType>(entityClass: EntityTarget<E>, where: FindOptionsWhere<E> | FindOptionsWhere<E>[], cache?: boolean): Promise<E[]>;
    findOne<E extends EntityType>(entityClass: EntityTarget<E>, options: FindOneOptions<E>): Promise<E | undefined>;
    findOneOrFail<E extends EntityType>(entityClass: EntityTarget<E>, options: FindOneOptions<E>): Promise<E>;
    findOneBy<E extends EntityType>(entityClass: EntityTarget<E>, where: FindOptionsWhere<E> | FindOptionsWhere<E>[], cache?: boolean): Promise<E | undefined>;
    findOneByOrFail<E extends EntityType>(entityClass: EntityTarget<E>, where: FindOptionsWhere<E> | FindOptionsWhere<E>[], cache?: boolean): Promise<E>;
    get<E extends EntityType>(entityClass: EntityTarget<E>, id: string): Promise<E | undefined>;
    get<E extends EntityType>(entityClass: EntityTarget<E>, options: GetOptions<E>): Promise<E | undefined>;
    getOrFail<E extends EntityType>(entityClass: EntityTarget<E>, id: string): Promise<E>;
    getOrFail<E extends EntityType>(entityClass: EntityTarget<E>, options: GetOptions<E>): Promise<E>;
    getOrInsert<E extends EntityType>(entityClass: EntityTarget<E>, id: string, create: (id: string) => E | Promise<E>): Promise<E>;
    getOrInsert<E extends EntityType>(entityClass: EntityTarget<E>, options: GetOptions<E>, create: (id: string) => E | Promise<E>): Promise<E>;
    /**
     * @deprecated use {@link getOrInsert} instead
     */
    getOrCreate<E extends EntityType>(entityClass: EntityTarget<E>, idOrOptions: string | GetOptions<E>, create: (id: string) => E | Promise<E>): Promise<E>;
    defer<E extends EntityType>(entityClass: EntityTarget<E>, id: string): DeferredEntity<E>;
    defer<E extends EntityType>(entityClass: EntityTarget<E>, options: GetOptions<E>): DeferredEntity<E>;
    commit(): Promise<void>;
    clear(): void;
    flush(): Promise<void>;
    private computeChangeSets;
    private computeChangeSet;
    private load;
    private getCached;
    private extractExtraUpsert;
    private commitOrderIndexes;
    private getCommitOrderIndex;
    private cloneEntity;
    private traverseEntity;
    getEntityMetadata(entityClass: EntityTarget<any>): EntityMetadata;
    private getEntityPkHash;
    private saveMany;
    private getFkSignature;
    private upsertMany;
    getMissing<E extends EntityType>(entityClass: EntityTarget<E>): Promise<string[]>;
    getMissingAll(): Promise<Map<EntityMetadata, string[]>>;
}
export declare class DeferredEntity<E extends EntityType> {
    private opts;
    constructor(opts: {
        get: () => Promise<E | undefined>;
        getOrFail: () => Promise<E>;
        getOrInsert: (create: (id: string) => E | Promise<E>) => Promise<E>;
    });
    get(): Promise<E | undefined>;
    getOrFail(): Promise<E>;
    getOrInsert(create: (id: string) => E | Promise<E>): Promise<E>;
    /**
     * @deprecated use {@link getOrInsert} instead
     */
    getOrCreate(create: (id: string) => E | Promise<E>): Promise<E>;
}
//# sourceMappingURL=store.d.ts.map