"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeferredEntity = exports.StoreWithCache = exports.Entity = void 0;
const logger_1 = require("@subsquid/logger");
const typeorm_store_1 = require("@subsquid/typeorm-store");
Object.defineProperty(exports, "Entity", { enumerable: true, get: function () { return typeorm_store_1.Entity; } });
const assert_1 = __importDefault(require("assert"));
const async_mutex_1 = require("async-mutex");
const typeorm_1 = require("typeorm");
const cacheMap_1 = require("./utils/cacheMap");
const deferList_1 = require("./utils/deferList");
const changeMap_1 = require("./utils/changeMap");
const misc_1 = require("./utils/misc");
// @ts-ignore
class StoreWithCache extends typeorm_store_1.Store {
    constructor(em, opts) {
        super(em, opts.changeTracker);
        this.em = em;
        this.currentCommit = new async_mutex_1.Mutex();
        this.currentLoad = new async_mutex_1.Mutex();
        this.commitOrder = opts.commitOrder;
        this.logger = (0, logger_1.createLogger)("sqd:store");
        this.cache = new cacheMap_1.CacheMap({ logger: this.logger });
        this.updates = new changeMap_1.ChangeMap({ logger: this.logger });
        this.defers = new deferList_1.DeferList({ logger: this.logger });
    }
    async insert(e) {
        await this.currentCommit.waitForUnlock();
        const entities = Array.isArray(e) ? e : [e];
        if (entities.length == 0)
            return;
        for (const entity of entities) {
            const md = this.getEntityMetadata(entity.constructor);
            this.updates.insert(md, entity.id);
            this.cache.add(md, entity, true);
        }
    }
    async upsert(e) {
        await this.currentCommit.waitForUnlock();
        let entities = Array.isArray(e) ? e : [e];
        if (entities.length == 0)
            return;
        for (const entity of entities) {
            const md = this.getEntityMetadata(entity.constructor);
            const isNew = this.updates.get(md, entity.id) === changeMap_1.ChangeType.Remove;
            this.updates.upsert(md, entity.id);
            this.cache.add(md, entity, isNew);
        }
    }
    async save(e) {
        return await this.upsert(e);
    }
    async remove(e, id) {
        await this.currentCommit.waitForUnlock();
        if (id == null) {
            const entities = Array.isArray(e) ? e : [e];
            if (entities.length == 0)
                return;
            for (const entity of entities) {
                const md = this.getEntityMetadata(entity.constructor);
                this.updates.remove(md, entity.id);
                this.cache.delete(md, entity.id);
            }
        }
        else {
            const ids = Array.isArray(id) ? id : [id];
            if (ids.length == 0)
                return;
            const md = this.getEntityMetadata(e);
            for (const id of ids) {
                this.updates.remove(md, id);
                this.cache.delete(md, id);
            }
        }
    }
    async count(entityClass, options) {
        await this.commit();
        return await super.count(entityClass, options);
    }
    async countBy(entityClass, where) {
        await this.commit();
        return await super.countBy(entityClass, where);
    }
    async find(entityClass, options) {
        await this.commit();
        const { cache, ...opts } = options;
        const res = await super.find(entityClass, opts);
        if (cache ?? true) {
            for (const entity of res) {
                this.traverseEntity(entity, opts.relations || null, (e) => {
                    const md = this.getEntityMetadata(e.constructor);
                    this.cache.add(md, e);
                });
            }
        }
        return res;
    }
    async findBy(entityClass, where, cache) {
        await this.commit();
        const res = await super.findBy(entityClass, where);
        if (cache ?? true) {
            for (const entity of res) {
                this.traverseEntity(entity, null, (e) => {
                    const md = this.getEntityMetadata(entityClass);
                    this.cache.add(md, e);
                });
            }
        }
        return res;
    }
    async findOne(entityClass, options) {
        await this.commit();
        const { cache, ...opts } = options;
        const res = await super.findOne(entityClass, opts);
        if (cache ?? true) {
            if (res != null) {
                this.traverseEntity(res, opts.relations || null, (e) => {
                    const md = this.getEntityMetadata(e.constructor);
                    this.cache.add(md, e);
                });
            }
        }
        return res;
    }
    async findOneOrFail(entityClass, options) {
        await this.commit();
        const { cache, ...opts } = options;
        const res = await super.findOneOrFail(entityClass, opts);
        if (cache ?? true) {
            this.traverseEntity(res, opts.relations || null, (e) => {
                const md = this.getEntityMetadata(e.constructor);
                this.cache.add(md, e);
            });
        }
        return res;
    }
    async findOneBy(entityClass, where, cache) {
        await this.commit();
        const res = await super.findOneBy(entityClass, where);
        if (cache ?? true) {
            this.traverseEntity(res, null, (e) => {
                const md = this.getEntityMetadata(e.constructor);
                this.cache.add(md, e);
            });
        }
        return res;
    }
    async findOneByOrFail(entityClass, where, cache) {
        await this.commit();
        const res = await super.findOneByOrFail(entityClass, where);
        if (cache ?? true) {
            this.traverseEntity(res, null, (e) => {
                const md = this.getEntityMetadata(e.constructor);
                this.cache.add(md, e);
            });
        }
        return res;
    }
    async get(entityClass, idOrOptions) {
        const { id, ...options } = parseGetOptions(idOrOptions);
        const metadata = this.getEntityMetadata(entityClass);
        let entity = this.getCached(metadata, id, options.relations);
        if (entity !== undefined)
            return entity ?? undefined;
        await this.load();
        entity = this.getCached(metadata, id, options.relations);
        if (entity !== undefined)
            return entity ?? undefined;
        return await this.findOne(entityClass, {
            where: { id },
            relations: options.relations,
        });
    }
    async getOrFail(entityClass, idOrOptions) {
        const options = parseGetOptions(idOrOptions);
        let e = await this.get(entityClass, options);
        if (e == null) {
            const metadata = this.getEntityMetadata(entityClass);
            throw new Error(`Missing entity ${metadata.name} with id "${options.id}"`);
        }
        return e;
    }
    async getOrInsert(entityClass, idOrOptions, create) {
        const options = parseGetOptions(idOrOptions);
        let e = await this.get(entityClass, options);
        if (e == null) {
            e = await create(options.id);
            await this.insert(e);
        }
        return e;
    }
    /**
     * @deprecated use {@link getOrInsert} instead
     */
    async getOrCreate(entityClass, idOrOptions, create) {
        return this.getOrInsert(entityClass, idOrOptions, create);
    }
    defer(entityClass, idOrOptions) {
        const md = this.getEntityMetadata(entityClass);
        const options = parseGetOptions(idOrOptions);
        this.defers.add(md, options.id, options.relations);
        return new DeferredEntity({
            get: async () => this.get(entityClass, options),
            getOrFail: async () => this.getOrFail(entityClass, options),
            getOrInsert: async (create) => this.getOrInsert(entityClass, options, create),
        });
    }
    async commit() {
        await this.currentCommit.runExclusive(async () => {
            const log = this.logger.child("commit");
            const changeSets = this.computeChangeSets();
            for (const { metadata, inserts, upserts } of changeSets) {
                if (upserts.length > 0) {
                    log.debug(`commit upserts for ${metadata.name} (${upserts.length})`);
                    await super.upsert(upserts);
                }
                if (inserts.length > 0) {
                    log.debug(`commit inserts for ${metadata.name} (${inserts.length})`);
                    await super.insert(inserts);
                }
            }
            const changeSetsReversed = [...changeSets].reverse();
            for (const { metadata, removes } of changeSetsReversed) {
                if (removes.length > 0) {
                    log.debug(`commit removes for ${metadata.name} (${removes.length})`);
                    await super.remove(metadata.target, removes);
                }
            }
            for (const { metadata, extraUpserts } of changeSets) {
                if (extraUpserts.length > 0) {
                    log.debug(`commit extra upserts for ${metadata.name} (${extraUpserts.length})`);
                    await super.upsert(extraUpserts);
                }
            }
        });
    }
    clear() {
        this.cache.clear();
        this.updates.clear();
    }
    async flush() {
        await this.commit();
        this.clear();
    }
    computeChangeSets() {
        const changes = this.updates.values();
        const changeSets = [];
        for (const metadata of this.commitOrder) {
            const entityChanges = changes.get(metadata);
            if (entityChanges == null)
                continue;
            const changeSet = this.computeChangeSet(metadata, entityChanges);
            changeSets.push(changeSet);
        }
        this.updates.clear();
        return changeSets;
    }
    computeChangeSet(metadata, changes) {
        const inserts = [];
        const upserts = [];
        const removes = [];
        const extraUpserts = [];
        for (const [id, type] of changes) {
            const cached = this.cache.get(metadata, id);
            switch (type) {
                case changeMap_1.ChangeType.Insert: {
                    (0, assert_1.default)(cached?.value != null, `unable to insert entity ${metadata.name} ${id}`);
                    inserts.push(cached.value);
                    const extraUpsert = this.extractExtraUpsert(cached.value);
                    if (extraUpsert != null) {
                        extraUpserts.push(extraUpsert);
                    }
                    break;
                }
                case changeMap_1.ChangeType.Upsert: {
                    (0, assert_1.default)(cached?.value != null, `unable to upsert entity ${metadata.name} ${id}`);
                    upserts.push(cached.value);
                    const extraUpsert = this.extractExtraUpsert(cached.value);
                    if (extraUpsert != null) {
                        extraUpserts.push(extraUpsert);
                    }
                    break;
                }
                case changeMap_1.ChangeType.Remove: {
                    removes.push(id);
                    break;
                }
            }
        }
        return { metadata, inserts, upserts, extraUpserts, removes };
    }
    async load() {
        await this.currentLoad.runExclusive(async () => {
            const defers = this.defers.values();
            for (const [metadata, data] of defers) {
                const ids = Array.from(data.ids);
                for (let batch of (0, misc_1.splitIntoBatches)(ids, 30000)) {
                    if (batch.length == 0)
                        continue;
                    await this.find(metadata.target, {
                        where: { id: (0, typeorm_1.In)(batch) },
                        relations: data.relations,
                    });
                }
                for (const id of ids) {
                    this.cache.ensure(metadata, id);
                }
            }
            this.defers.clear();
        });
    }
    getCached(metadata, id, mask) {
        const cached = this.cache.get(metadata, id);
        if (cached == null) {
            return undefined;
        }
        else if (cached.value == null) {
            return null;
        }
        else {
            return this.cloneEntity(cached.value, mask);
        }
    }
    extractExtraUpsert(entity) {
        const metadata = this.getEntityMetadata(entity.constructor);
        const commitOrderIndex = this.getCommitOrderIndex(metadata);
        let extraUpsert;
        for (const relation of metadata.relations) {
            if (relation.foreignKeys.length == 0)
                continue;
            const inverseEntity = relation.getEntityValue(entity);
            if (inverseEntity == null)
                continue;
            const inverseMetadata = relation.inverseEntityMetadata;
            if (metadata === inverseMetadata && inverseEntity.id === entity.id)
                continue;
            const invCommitOrderIndex = this.getCommitOrderIndex(inverseMetadata);
            if (invCommitOrderIndex < commitOrderIndex)
                continue;
            (0, assert_1.default)(relation.isNullable);
            const invUpdateType = this.updates.get(inverseMetadata, inverseEntity.id);
            if (invUpdateType === changeMap_1.ChangeType.Insert) {
                if (extraUpsert == null) {
                    extraUpsert = metadata.create();
                    extraUpsert.id = entity.id;
                    Object.assign(extraUpsert, entity);
                }
                relation.setEntityValue(entity, undefined);
            }
        }
        return extraUpsert;
    }
    getCommitOrderIndex(metadata) {
        if (this.commitOrderIndexes == null) {
            this.commitOrderIndexes = new Map(this.commitOrder.map((m, i) => [m, i]));
        }
        const index = this.commitOrderIndexes.get(metadata);
        (0, assert_1.default)(index != null);
        return index;
    }
    cloneEntity(entity, mask) {
        const metadata = this.getEntityMetadata(entity.constructor);
        const clonedEntity = metadata.create();
        for (const column of metadata.nonVirtualColumns) {
            const objectColumnValue = column.getEntityValue(entity);
            if (objectColumnValue !== undefined) {
                column.setEntityValue(clonedEntity, (0, misc_1.copy)(objectColumnValue));
            }
        }
        if (mask != null) {
            for (const relation of metadata.relations) {
                const inverseMask = mask[relation.propertyName];
                if (!inverseMask)
                    continue;
                const inverseEntityMock = relation.getEntityValue(entity);
                if (inverseEntityMock === undefined) {
                    return undefined; // relation is missing, but required
                }
                else if (inverseEntityMock === null) {
                    relation.setEntityValue(clonedEntity, null);
                }
                else {
                    const cachedInverseEntity = this.getCached(relation.inverseEntityMetadata, inverseEntityMock.id, typeof inverseMask === "boolean" ? undefined : inverseMask);
                    if (cachedInverseEntity === undefined) {
                        return undefined; // unable to build whole relation chain
                    }
                    else {
                        relation.setEntityValue(clonedEntity, cachedInverseEntity);
                    }
                }
            }
        }
        return clonedEntity;
    }
    traverseEntity(entity, mask, fn) {
        if (entity == null)
            return;
        if (mask != null) {
            const metadata = this.getEntityMetadata(entity.constructor);
            for (const relation of metadata.relations) {
                const inverseMask = mask[relation.propertyName];
                if (!inverseMask)
                    continue;
                const inverseEntity = relation.getEntityValue(entity);
                if (relation.isOneToMany || relation.isManyToMany) {
                    if (!Array.isArray(inverseEntity))
                        continue;
                    for (const entity of inverseEntity) {
                        this.traverseEntity(entity, inverseMask === true ? null : inverseMask, fn);
                    }
                }
                else {
                    this.traverseEntity(inverseEntity, inverseMask === true ? null : inverseMask, fn);
                }
            }
        }
        fn(entity);
    }
    getEntityMetadata(entityClass) {
        const em = this.em();
        return em.connection.getMetadata(entityClass);
    }
    getEntityPkHash(metadata, entity) {
        const columns = metadata.primaryColumns;
        if (columns.length === 1) {
            const pk = columns[0].getEntityValue(entity);
            (0, assert_1.default)(pk != null);
            return String(pk);
        }
        else {
            return columns
                .map((c) => {
                const pk = c.getEntityValue(entity);
                (0, assert_1.default)(pk != null);
                return String(pk);
            })
                .join(":");
        }
    }
    // @ts-ignore
    async saveMany(entityClass, entities) {
        (0, assert_1.default)(entities.length > 0);
        let em = this.em();
        let metadata = em.connection.getMetadata(entityClass);
        let fk = metadata.columns.filter((c) => c.relationMetadata);
        if (fk.length == 0) {
            return this.upsertMany(em, entityClass, entities);
        }
        let signatures = entities
            .map((e) => ({ entity: e, value: this.getFkSignature(fk, e) }))
            .sort((a, b) => (a.value > b.value ? -1 : b.value > a.value ? 1 : 0));
        let currentSignature = signatures[0].value;
        let batch = [];
        for (let s of signatures) {
            if (s.value === currentSignature) {
                batch.push(s.entity);
            }
            else {
                await this.upsertMany(em, entityClass, batch);
                currentSignature = s.value;
                batch = [s.entity];
            }
        }
        if (batch.length) {
            await this.upsertMany(em, entityClass, batch);
        }
    }
    getFkSignature(fk, entity) {
        return super["getFkSignature"](fk, entity);
    }
    async upsertMany(em, entityClass, entities) {
        return super["upsertMany"](em, entityClass, entities);
    }
}
exports.StoreWithCache = StoreWithCache;
class DeferredEntity {
    constructor(opts) {
        this.opts = opts;
    }
    async get() {
        return this.opts.get();
    }
    async getOrFail() {
        return this.opts.getOrFail();
    }
    async getOrInsert(create) {
        return this.opts.getOrInsert(create);
    }
    /**
     * @deprecated use {@link getOrInsert} instead
     */
    async getOrCreate(create) {
        return this.getOrInsert(create);
    }
}
exports.DeferredEntity = DeferredEntity;
function parseGetOptions(idOrOptions) {
    if (typeof idOrOptions === "string") {
        return { id: idOrOptions };
    }
    else {
        return idOrOptions;
    }
}
//# sourceMappingURL=store.js.map