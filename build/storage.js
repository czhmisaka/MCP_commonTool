"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityStorage = void 0;
/*
 * @Date: 2025-05-12 02:59:26
 * @LastEditors: CZH
 * @LastEditTime: 2025-05-12 04:44:36
 * @FilePath: /identity-mcp-server/src/storage.ts
 */
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const STORAGE_FILE = path_1.default.join(__dirname, '../build/identities.json');
class IdentityStorage {
    constructor() {
        this.store = new Map();
        this.loadFromFile().catch(err => {
            console.error('Failed to load identities:', err);
        });
    }
    loadFromFile() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield fs_1.promises.readFile(STORAGE_FILE, 'utf-8');
                const identities = JSON.parse(data);
                this.store = new Map(identities.map(id => [id.id, id]));
            }
            catch (err) {
                if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
                    // 文件不存在，创建空存储
                    yield this.saveToFile();
                }
                else {
                    throw err;
                }
            }
        });
    }
    saveToFile() {
        return __awaiter(this, void 0, void 0, function* () {
            const identities = Array.from(this.store.values());
            yield fs_1.promises.writeFile(STORAGE_FILE, JSON.stringify(identities, null, 2));
        });
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const id = (0, uuid_1.v4)();
            const now = new Date();
            const identity = Object.assign(Object.assign({ id }, data), { memories: ((_a = data.memories) === null || _a === void 0 ? void 0 : _a.map(m => typeof m === 'string' ? {
                    id: (0, uuid_1.v4)(),
                    content: m,
                    keywords: [],
                    timestamp: now.toISOString()
                } : m)) || [], chatHistory: [], createdAt: now.toISOString(), updatedAt: now.toISOString() });
            this.store.set(id, identity);
            yield this.saveToFile();
            return identity;
        });
    }
    get(id) {
        return this.store.get(id);
    }
    update(id, changes) {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = this.store.get(id);
            if (!existing)
                return undefined;
            const now = new Date();
            const updated = Object.assign(Object.assign(Object.assign({}, existing), changes), { memories: changes.memories !== undefined
                    ? changes.memories.map(m => typeof m === 'string' ? {
                        id: (0, uuid_1.v4)(),
                        content: m,
                        keywords: [],
                        timestamp: now.toISOString()
                    } : m)
                    : existing.memories, chatHistory: changes.chatHistory !== undefined
                    ? changes.chatHistory.slice(-100) // 限制最多100条记录
                    : existing.chatHistory, updatedAt: now.toISOString() });
            this.store.set(id, updated);
            yield this.saveToFile();
            return updated;
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const deleted = this.store.delete(id);
            if (deleted) {
                yield this.saveToFile();
            }
            return deleted;
        });
    }
    list() {
        return Array.from(this.store.values());
    }
}
exports.IdentityStorage = IdentityStorage;
