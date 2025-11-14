"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitIntoBatches = splitIntoBatches;
exports.copy = copy;
exports.mergeRelataions = mergeRelataions;
function* splitIntoBatches(list, maxBatchSize) {
    if (list.length <= maxBatchSize) {
        yield list;
    }
    else {
        let offset = 0;
        while (list.length - offset > maxBatchSize) {
            yield list.slice(offset, offset + maxBatchSize);
            offset += maxBatchSize;
        }
        yield list.slice(offset);
    }
}
const copiedObjects = new WeakMap();
function copy(obj) {
    if (typeof obj !== 'object' || obj == null) {
        return obj;
    }
    if (copiedObjects.has(obj)) {
        return copiedObjects.get(obj);
    }
    else if (obj instanceof Date) {
        return new Date(obj);
    }
    else if (Array.isArray(obj)) {
        const clone = obj.map((i) => copy(i));
        copiedObjects.set(obj, clone);
        return clone;
    }
    else if (obj instanceof Map) {
        const clone = new Map(Array.from(obj).map((i) => copy(i)));
        copiedObjects.set(obj, clone);
        return clone;
    }
    else if (obj instanceof Set) {
        const clone = new Set(Array.from(obj).map((i) => copy(i)));
        copiedObjects.set(obj, clone);
        return clone;
    }
    else if (ArrayBuffer.isView(obj)) {
        return copyBuffer(obj);
    }
    else {
        const clone = Object.create(Object.getPrototypeOf(obj));
        copiedObjects.set(obj, clone);
        for (const k in obj) {
            if (obj.hasOwnProperty(k)) {
                clone[k] = copy(obj[k]);
            }
        }
        return clone;
    }
}
function copyBuffer(buf) {
    if (buf instanceof Buffer) {
        return Buffer.from(buf);
    }
    else {
        return new buf.constructor(buf.buffer.slice(), buf.byteOffset, buf.length);
    }
}
function mergeRelataions(a, b) {
    const mergedObject = {};
    for (const key in a) {
        mergedObject[key] = a[key];
    }
    for (const key in b) {
        const bValue = b[key];
        const value = mergedObject[key];
        if (typeof bValue === 'object') {
            mergedObject[key] = (typeof value === 'object' ? mergeRelataions(value, bValue) : bValue);
        }
        else {
            mergedObject[key] = value || bValue;
        }
    }
    return mergedObject;
}
//# sourceMappingURL=misc.js.map