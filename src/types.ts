/*
 * @Date: 2025-05-12 02:59:08
 * @LastEditors: CZH
 * @LastEditTime: 2025-05-12 05:09:10
 * @FilePath: /identity-mcp-server/src/types.ts
 */
export interface MemoryItem {
    id: string;
    content: string;
    keywords: string[];
    timestamp: string;
    context?: {
        conversationId?: string;
        relatedMemories?: string[];
    };
}

export interface ChatRecord {
    id: string;
    messages: ChatMessage[];
    timestamp: string;
}

export interface ApiEndpoint {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    auth?: {
        type: 'basic' | 'bearer' | 'apiKey';
        credentials: string;
    };
    parameters?: Array<{
        name: string;
        required: boolean;
        in: 'query' | 'body' | 'path';
    }>;
}

export interface ApiCapability {
    name: string;
    baseUrl?: string;
    endpoints: ApiEndpoint[];
}

export interface Identity {
    id: string;
    name: string;
    traits: Record<string, any>;
    memories: MemoryItem[];
    chatHistory: ChatRecord[];
    createdAt: string;
    updatedAt: string;
    chatConfig?: {
        model: string;
        apiKey: string;
        temperature?: number;
        timeout?: number;
    };
    capabilities?: {
        apis: ApiCapability[];
    };
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string;
}

export type CreateIdentityDto = Omit<Identity, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateIdentityDto = Partial<CreateIdentityDto>;
