"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeMap = exports.ChangeType = void 0;
var ChangeType;
(function (ChangeType) {
    ChangeType["Insert"] = "Insert";
    ChangeType["Upsert"] = "Upsert";
    ChangeType["Remove"] = "Remove";
})(ChangeType || (exports.ChangeType = ChangeType = {}));
class ChangeMap {
    constructor(opts) {
        this.opts = opts;
        this.map = new Map();
        this.logger = this.opts.logger.child('changes');
    }
    get(metadata, id) {
        return this.getChanges(metadata).get(id);
    }
    set(metadata, id, type) {
        this.getChanges(metadata).set(id, type);
        this.logger.debug(`entity ${metadata.name} ${id} marked as ${type}`);
        return this;
    }
    insert(metadata, id) {
        const prevType = this.get(metadata, id);
        switch (prevType) {
            case undefined:
                this.set(metadata, id, ChangeType.Insert);
                this.logger.debug(`entity ${metadata.name} ${id} already marked as ${ChangeType.Insert}`);
                break;
            case ChangeType.Remove:
                this.set(metadata, id, ChangeType.Upsert);
                break;
            case ChangeType.Insert:
            case ChangeType.Upsert:
                throw new Error(`${metadata.name} ${id} is already marked as ${ChangeType.Insert} or ${ChangeType.Upsert}`);
        }
    }
    upsert(metadata, id) {
        const prevType = this.get(metadata, id);
        switch (prevType) {
            case ChangeType.Insert:
                this.logger.debug(`entity ${metadata.name} ${id} already marked as ${ChangeType.Insert}`);
                break;
            case ChangeType.Upsert:
                this.logger.debug(`entity ${metadata.name} ${id} already marked as ${ChangeType.Upsert}`);
                break;
            default:
                this.set(metadata, id, ChangeType.Upsert);
                break;
        }
    }
    remove(metadata, id) {
        const prevType = this.get(metadata, id);
        switch (prevType) {
            case ChangeType.Insert:
                this.getChanges(metadata).delete(id);
                break;
            case ChangeType.Remove:
                this.logger.debug(`entity ${metadata.name} ${id} already marked as ${ChangeType.Remove}`);
                break;
            default:
                this.set(metadata, id, ChangeType.Remove);
        }
    }
    clear() {
        this.logger.debug(`cleared`);
        this.map.clear();
    }
    values() {
        return new Map(this.map);
    }
    getChanges(metadata) {
        let map = this.map.get(metadata);
        if (map == null) {
            map = new Map();
            this.map.set(metadata, map);
        }
        return map;
    }
}
exports.ChangeMap = ChangeMap;
//# sourceMappingURL=changeMap.js.map