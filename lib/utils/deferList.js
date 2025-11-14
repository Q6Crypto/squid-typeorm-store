"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeferList = void 0;
const misc_1 = require("./misc");
class DeferList {
    constructor(opts) {
        this.opts = opts;
        this.map = new Map();
        this.logger = this.opts.logger.child('defer');
    }
    add(metadata, id, relations) {
        const data = this.getData(metadata);
        data.ids.add(id);
        this.logger.debug(`entity ${metadata.name} ${id} deferred`);
        if (relations != null) {
            data.relations = (0, misc_1.mergeRelataions)(data.relations, relations);
        }
    }
    values() {
        return new Map(this.map);
    }
    clear() {
        this.logger.debug(`cleared`);
        this.map.clear();
    }
    getData(metadata) {
        let list = this.map.get(metadata);
        if (list == null) {
            list = { ids: new Set(), relations: {} };
            this.map.set(metadata, list);
        }
        return list;
    }
}
exports.DeferList = DeferList;
//# sourceMappingURL=deferList.js.map