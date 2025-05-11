#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamHandler } from './chat/StreamHandler';
import { GLM4Adapter } from './chat/GLM4Adapter';
import { ChatMessage, MemoryItem, ChatRecord } from './types';
import {
    CallToolRequestSchema,
    ErrorCode,
    ListResourcesRequestSchema,
    ListResourceTemplatesRequestSchema,
    ListToolsRequestSchema,
    McpError,
    ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { IdentityStorage } from './storage.js';
import { Identity, CreateIdentityDto } from './types.js';
import { v4 as uuidv4 } from 'uuid';

class IdentityServer {
    private server: Server;
    private storage: IdentityStorage;

    constructor() {
        this.storage = new IdentityStorage();
        this.server = new Server(
            {
                name: 'identity-mcp-server',
                version: '0.1.0',
            },
            {
                capabilities: {
                    resources: {},
                    tools: {},
                },
            }
        );

        this.setupToolHandlers();
        this.server.onerror = (error) => console.error('[MCP Error]', error);
    }

    private setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'create_identity',
                    description: 'Create a new identity',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            traits: { type: 'object' },
                            memories: {
                                type: 'array',
                                items: {
                                    oneOf: [
                                        { type: 'string' },
                                        { $ref: '#/definitions/MemoryItem' }
                                    ]
                                }
                            }
                        },
                        required: ['name']
                    }
                },
                {
                    name: 'get_identity',
                    description: 'Get identity details',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' }
                        },
                        required: ['id']
                    }
                },
                {
                    name: 'update_identity',
                    description: 'Update identity',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            traits: { type: 'object' },
                            memories: {
                                type: 'array',
                                items: {
                                    oneOf: [
                                        { type: 'string' },
                                        { $ref: '#/definitions/MemoryItem' }
                                    ]
                                }
                            }
                        },
                        required: ['id']
                    }
                },
                {
                    name: 'delete_identity',
                    description: 'Delete identity',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' }
                        },
                        required: ['id']
                    }
                },
                {
                    name: 'list_identities',
                    description: 'List all identities',
                    inputSchema: {
                        type: 'object',
                        properties: {}
                    }
                },
                {
                    name: 'chat',
                    description: 'Chat with identity assistant',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            identityId: { type: 'string' },
                            messages: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        role: { type: 'string', enum: ['user', 'assistant', 'system'] },
                                        content: { type: 'string' }
                                    },
                                    required: ['role', 'content']
                                }
                            }
                        },
                        required: ['identityId', 'messages']
                    }
                }
            ],
            definitions: {
                MemoryItem: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        content: { type: 'string' },
                        keywords: { type: 'array', items: { type: 'string' } },
                        timestamp: { type: 'string' },
                        context: {
                            type: 'object',
                            properties: {
                                conversationId: { type: 'string' },
                                relatedMemories: { type: 'array', items: { type: 'string' } }
                            }
                        }
                    },
                    required: ['id', 'content', 'keywords', 'timestamp']
                }
            }
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            switch (request.params.name) {
                case 'create_identity':
                    return this.handleCreateIdentity(request.params.arguments);
                case 'get_identity':
                    return this.handleGetIdentity(request.params.arguments);
                case 'update_identity':
                    return this.handleUpdateIdentity(request.params.arguments);
                case 'delete_identity':
                    return this.handleDeleteIdentity(request.params.arguments);
                case 'list_identities':
                    return this.handleListIdentities();
                case 'chat':
                    return this.handleChat(request.params.arguments);
                default:
                    throw new McpError(ErrorCode.MethodNotFound, 'Unknown tool');
            }
        });
    }

    private async handleCreateIdentity(args: any) {
        try {
            const identity = await this.storage.create(args as CreateIdentityDto);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(identity, null, 2)
                }]
            };
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err));
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({ success: false, error: error.message }, null, 2)
                }],
                isError: true
            };
        }
    }

    private async handleGetIdentity(args: any) {
        try {
            const identity = this.storage.get(args.id);
            if (!identity) {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({ success: false, error: 'Identity not found' }, null, 2)
                    }]
                };
            }
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({ success: true, data: identity }, null, 2)
                }]
            };
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err));
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({ success: false, error: error.message }, null, 2)
                }]
            };
        }
    }

    private async handleUpdateIdentity(args: any) {
        try {
            const { id, ...changes } = args;
            const updated = await this.storage.update(id, changes);
            if (!updated) {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({ success: false, error: 'Identity not found' }, null, 2)
                    }]
                };
            }
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({ success: true, data: updated }, null, 2)
                }]
            };
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err));
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({ success: false, error: error.message }, null, 2)
                }]
            };
        }
    }

    private async handleDeleteIdentity(args: any) {
        const success = await this.storage.delete(args.id);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({ success }, null, 2)
            }]
        };
    }

    private async handleListIdentities() {
        try {
            const identities = this.storage.list();
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({ success: true, data: identities }, null, 2)
                }]
            };
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err));
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({ success: false, error: error.message }, null, 2)
                }]
            };
        }
    }

    private async handleChat(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
        try {
            const identity = this.storage.get(args.identityId);
            if (!identity || !identity.chatConfig) {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({ success: false, error: 'Identity not found or chat not configured' }, null, 2)
                    }]
                };
            }

            const streamHandler = new StreamHandler(
                identity.chatConfig.apiKey,
                identity.chatConfig.model,
                identity.chatConfig.timeout
            );

            return new Promise<{ content: Array<{ type: string; text: string }> }>((resolve) => {
                let fullResponse = '';
                let messages: ChatMessage[] = args.messages;

                // 创建新的聊天记录
                const chatRecord: ChatRecord = {
                    id: uuidv4(),
                    messages: [...messages],
                    timestamp: new Date().toISOString()
                };

                streamHandler.on('data', (data: string) => {
                    fullResponse += data;
                });

                streamHandler.on('error', (err) => {
                    resolve({
                        content: [{
                            type: 'text',
                            text: JSON.stringify({ success: false, error: err.message }, null, 2)
                        }]
                    });
                });

                streamHandler.on('end', async () => {
                    try {
                        if (fullResponse) {
                            // 添加助手回复到聊天记录
                            chatRecord.messages.push({
                                role: 'assistant',
                                content: fullResponse,
                                timestamp: new Date().toISOString()
                            });

                            // 获取最新的身份信息
                            const latestIdentity = this.storage.get(args.identityId);
                            if (!latestIdentity) return;

                            // 保存聊天记录
                            console.log('正在保存聊天记录...');
                            const updatedWithHistory = await this.storage.update(args.identityId, {
                                chatHistory: [...(latestIdentity.chatHistory || []), chatRecord]
                            });
                            console.log('聊天记录保存结果:', updatedWithHistory ? '成功' : '失败');

                            // 保存记忆
                            const keywords = await streamHandler.extractKeywords(fullResponse);
                            const memory: MemoryItem = {
                                id: uuidv4(),
                                content: fullResponse,
                                keywords,
                                timestamp: new Date().toISOString(),
                                context: {
                                    conversationId: args.identityId
                                }
                            };

                            console.log('正在保存记忆...');
                            const updatedWithMemory = await this.storage.update(args.identityId, {
                                memories: [...(latestIdentity.memories || []), memory]
                            });
                            console.log('记忆保存结果:', updatedWithMemory ? '成功' : '失败');
                        }
                    } catch (e) {
                        console.error('Failed to save chat history or memory:', e);
                    }

                    resolve({
                        content: [{
                            type: 'text',
                            text: JSON.stringify({ success: true, data: fullResponse }, null, 2)
                        }]
                    });
                });

                streamHandler.startStream(messages)
                    .catch(err => {
                        resolve({
                            content: [{
                                type: 'text',
                                text: JSON.stringify({ success: false, error: err.message }, null, 2)
                            }]
                        });
                    });
            });
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err));
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({ success: false, error: error.message }, null, 2)
                }]
            };
        }
    }

    async run(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Identity MCP Server running on stdio');
    }
}

const server = new IdentityServer();
server.run().catch((error: Error) => console.error(error));
