"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeormDatabaseWithCache = void 0;
const typeorm_store_1 = require("@subsquid/typeorm-store");
const assert_1 = __importDefault(require("assert"));
const store_1 = require("./store");
const util_internal_1 = require("@subsquid/util-internal");
const relationGraph_1 = require("./utils/relationGraph");
// @ts-ignore
class TypeormDatabaseWithCache extends typeorm_store_1.TypeormDatabase {
    // @ts-ignore
    transact(info, cb) {
        return super.transact(info, cb);
    }
    // @ts-ignore
    transactHot(info, cb) {
        return super.transactHot(info, cb);
    }
    // @ts-ignore
    transactHot2(info, cb) {
        return super.transactHot2(info, cb);
    }
    async performUpdates(cb, em, changes) {
        let running = true;
        let store = new store_1.StoreWithCache(() => {
            (0, assert_1.default)(running, `too late to perform db updates, make sure you haven't forgot to await on db query`);
            return em;
        }, {
            changeTracker: changes,
            commitOrder: this.getCommitOrder(),
        });
        try {
            await cb(store);
            await store.flush();
        }
        finally {
            running = false;
        }
    }
    getCommitOrder() {
        return (0, relationGraph_1.getCommitOrder)(this['con'].entityMetadatas);
    }
}
exports.TypeormDatabaseWithCache = TypeormDatabaseWithCache;
__decorate([
    util_internal_1.def,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TypeormDatabaseWithCache.prototype, "getCommitOrder", null);
//# sourceMappingURL=database.js.map