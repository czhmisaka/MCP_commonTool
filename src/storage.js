"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityStorage = void 0;
/*
 * @Date: 2025-05-12 02:59:26
 * @LastEditors: CZH
 * @LastEditTime: 2025-05-12 02:59:39
 * @FilePath: /语音助手/Users/chenzhihan/Documents/Cline/MCP/identity-mcp-server/src/storage.ts
 */
const uuid_1 = require("uuid");
class IdentityStorage {
    constructor() {
        this.store = new Map();
    }
    create(data) {
        const id = (0, uuid_1.v4)();
        const now = new Date();
        const identity = Object.assign(Object.assign({ id }, data), { createdAt: now, updatedAt: now });
        this.store.set(id, identity);
        return identity;
    }
    get(id) {
        return this.store.get(id);
    }
    update(id, changes) {
        const existing = this.store.get(id);
        if (!existing)
            return undefined;
        const updated = Object.assign(Object.assign(Object.assign({}, existing), changes), { updatedAt: new Date() });
        this.store.set(id, updated);
        return updated;
    }
    delete(id) {
        return this.store.delete(id);
    }
    list() {
        return Array.from(this.store.values());
    }
}
exports.IdentityStorage = IdentityStorage;
