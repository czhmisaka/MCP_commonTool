/*
 * @Date: 2025-05-12 02:59:08
 * @LastEditors: CZH
 * @LastEditTime: 2025-05-12 04:33:26
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

export interface Identity {
    id: string;
    name: string;
    traits: Record<string, any>;
    memories: MemoryItem[];
    chatHistory: ChatRecord[];  // 新增聊天记录存储
    createdAt: string;
    updatedAt: string;
    chatConfig?: {
        model: string;
        apiKey: string;
        temperature?: number;
        timeout?: number;
    };
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string;
}

export type CreateIdentityDto = Omit<Identity, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateIdentityDto = Partial<CreateIdentityDto>;
