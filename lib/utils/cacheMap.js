"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheMap = exports.CachedEntity = void 0;
const misc_1 = require("./misc");
class CachedEntity {
    constructor(value = null) {
        this.value = value;
    }
}
exports.CachedEntity = CachedEntity;
class CacheMap {
    constructor(opts) {
        this.opts = opts;
        this.map = new Map();
        this.logger = this.opts.logger.child('cache');
    }
    exist(metadata, id) {
        const cacheMap = this.getEntityCache(metadata);
        const cachedEntity = cacheMap.get(id);
        return !!cachedEntity?.value;
    }
    get(metadata, id) {
        const cacheMap = this.getEntityCache(metadata);
        return cacheMap.get(id);
    }
    ensure(metadata, id) {
        const cacheMap = this.getEntityCache(metadata);
        if (cacheMap.has(id))
            return;
        cacheMap.set(id, new CachedEntity());
        this.logger.debug(`added empty entity ${metadata.name} ${id}`);
    }
    delete(metadata, id) {
        const cacheMap = this.getEntityCache(metadata);
        cacheMap.set(id, new CachedEntity());
        this.logger.debug(`deleted entity ${metadata.name} ${id}`);
    }
    clear() {
        this.logger.debug(`cleared`);
        this.map.clear();
    }
    add(metadata, entity, isNew = false) {
        const cacheMap = this.getEntityCache(metadata);
        let cached = cacheMap.get(entity.id);
        if (cached == null) {
            cached = new CachedEntity();
            cacheMap.set(entity.id, cached);
        }
        let cachedEntity = cached.value;
        if (cachedEntity == null) {
            cachedEntity = cached.value = metadata.create();
            cachedEntity.id = entity.id;
            this.logger.debug(`added entity ${metadata.name} ${entity.id}`);
        }
        for (const column of metadata.nonVirtualColumns) {
            const objectColumnValue = column.getEntityValue(entity);
            if (isNew || objectColumnValue !== undefined) {
                column.setEntityValue(cachedEntity, (0, misc_1.copy)(objectColumnValue ?? null));
            }
        }
        for (const relation of metadata.relations) {
            if (!relation.isOwning)
                continue;
            const inverseEntity = relation.getEntityValue(entity);
            const inverseMetadata = relation.inverseEntityMetadata;
            if (inverseEntity != null) {
                const mockEntity = inverseMetadata.create();
                Object.assign(mockEntity, { id: inverseEntity.id });
                relation.setEntityValue(cachedEntity, mockEntity);
            }
            else if (isNew || inverseEntity === null) {
                relation.setEntityValue(cachedEntity, null);
            }
        }
    }
    values() {
        return new Map(this.map);
    }
    getEntityCache(metadata) {
        let map = this.map.get(metadata);
        if (map == null) {
            map = new Map();
            this.map.set(metadata, map);
        }
        return map;
    }
}
exports.CacheMap = CacheMap;
//# sourceMappingURL=cacheMap.js.map