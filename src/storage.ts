/*
 * @Date: 2025-05-12 02:59:26
 * @LastEditors: CZH
 * @LastEditTime: 2025-05-12 05:10:56
 * @FilePath: /identity-mcp-server/src/storage.ts
 */
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Identity, CreateIdentityDto, UpdateIdentityDto, ApiCapability } from './types';

const STORAGE_FILE = path.join(__dirname, '../build/identities.json');

export class IdentityStorage {
    private store = new Map<string, Identity>();

    constructor() {
        this.loadFromFile().catch(err => {
            console.error('Failed to load identities:', err);
        });
    }

    private async loadFromFile(): Promise<void> {
        try {
            const data = await fs.readFile(STORAGE_FILE, 'utf-8');
            const identities = JSON.parse(data) as Identity[];
            this.store = new Map(identities.map(id => [id.id, id]));
        } catch (err: unknown) {
            if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
                // 文件不存在，创建空存储
                await this.saveToFile();
            } else {
                throw err;
            }
        }
    }

    private async saveToFile(): Promise<void> {
        const identities = Array.from(this.store.values());
        await fs.writeFile(STORAGE_FILE, JSON.stringify(identities, null, 2));
    }

    async create(data: CreateIdentityDto): Promise<Identity> {
        const id = uuidv4();
        const now = new Date();
        const identity: Identity = {
            id,
            ...data,
            memories: data.memories?.map(m => typeof m === 'string' ? {
                id: uuidv4(),
                content: m,
                keywords: [],
                timestamp: now.toISOString()
            } : m) || [],
            chatHistory: [], // 初始化空聊天记录
            capabilities: data.capabilities || undefined,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
        };
        this.store.set(id, identity);
        await this.saveToFile();
        return identity;
    }

    get(id: string): Identity | undefined {
        return this.store.get(id);
    }

    async update(id: string, changes: UpdateIdentityDto): Promise<Identity | undefined> {
        const existing = this.store.get(id);
        if (!existing) return undefined;

        const now = new Date();
        const updated = {
            ...existing,
            ...changes,
            memories: changes.memories !== undefined
                ? changes.memories.map(m => typeof m === 'string' ? {
                    id: uuidv4(),
                    content: m,
                    keywords: [],
                    timestamp: now.toISOString()
                } : m)
                : existing.memories,
            chatHistory: changes.chatHistory !== undefined
                ? changes.chatHistory.slice(-100) // 限制最多100条记录
                : existing.chatHistory,
            updatedAt: now.toISOString()
        };
        this.store.set(id, updated);
        await this.saveToFile();
        return updated;
    }

    async delete(id: string): Promise<boolean> {
        const deleted = this.store.delete(id);
        if (deleted) {
            await this.saveToFile();
        }
        return deleted;
    }

    list(): Identity[] {
        return Array.from(this.store.values());
    }
}
