#!/usr/bin/env node
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const StreamHandler_1 = require("./chat/StreamHandler");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const storage_js_1 = require("./storage.js");
const uuid_1 = require("uuid");
const axios_1 = __importDefault(require("axios"));
class IdentityServer {
    constructor() {
        this.storage = new storage_js_1.IdentityStorage();
        this.server = new index_js_1.Server({
            name: 'identity-mcp-server',
            version: '0.1.0',
        }, {
            capabilities: {
                resources: {},
                tools: {},
            },
        });
        this.setupToolHandlers();
        this.server.onerror = (error) => console.error('[MCP Error]', error);
    }
    setupToolHandlers() {
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, () => __awaiter(this, void 0, void 0, function* () {
            return ({
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
                                },
                                capabilities: {
                                    type: 'object',
                                    properties: {
                                        apis: {
                                            type: 'array',
                                            items: { $ref: '#/definitions/ApiCapability' }
                                        }
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
                                },
                                capabilities: {
                                    type: 'object',
                                    properties: {
                                        apis: {
                                            type: 'array',
                                            items: { $ref: '#/definitions/ApiCapability' }
                                        }
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
                    },
                    {
                        name: 'generate_official_doc',
                        description: 'Generate official document',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                elements: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            type: {
                                                type: 'string',
                                                enum: ['红头文件标头', '文件函号', '正文标题', '告知对象', '正文段落', '落款', '抄送', '换行']
                                            },
                                            word: { type: 'string' },
                                            date: { type: 'number', optional: true }
                                        },
                                        required: ['type', 'word']
                                    }
                                },
                                config: {
                                    type: 'object',
                                    properties: {
                                        lineHeightNumber: { type: 'number', default: 25 },
                                        lineNumber: { type: 'number', default: 26 },
                                        tabIndexNumber: { type: 'number', default: 2 }
                                    }
                                },
                                fileName: { type: 'string', default: 'official_document.doc' }
                            },
                            required: ['elements']
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
                    },
                    ApiCapability: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            baseUrl: { type: 'string' },
                            endpoints: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        path: { type: 'string' },
                                        method: {
                                            type: 'string',
                                            enum: ['GET', 'POST', 'PUT', 'DELETE']
                                        },
                                        headers: {
                                            type: 'object',
                                            additionalProperties: { type: 'string' }
                                        },
                                        auth: {
                                            type: 'object',
                                            properties: {
                                                type: {
                                                    type: 'string',
                                                    enum: ['basic', 'bearer', 'apiKey']
                                                },
                                                credentials: { type: 'string' }
                                            },
                                            required: ['type', 'credentials']
                                        },
                                        parameters: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    name: { type: 'string' },
                                                    required: { type: 'boolean' },
                                                    in: {
                                                        type: 'string',
                                                        enum: ['query', 'body', 'path']
                                                    }
                                                },
                                                required: ['name', 'required', 'in']
                                            }
                                        }
                                    },
                                    required: ['path', 'method']
                                }
                            }
                        },
                        required: ['name', 'endpoints']
                    }
                }
            });
        }));
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, (request) => __awaiter(this, void 0, void 0, function* () {
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
                case 'generate_official_doc':
                    return this.handleGenerateOfficialDoc(request.params.arguments);
                default:
                    throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, 'Unknown tool');
            }
        }));
    }
    handleCreateIdentity(args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const identity = yield this.storage.create(args);
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify(identity, null, 2)
                        }]
                };
            }
            catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify({ success: false, error: error.message }, null, 2)
                        }],
                    isError: true
                };
            }
        });
    }
    handleGetIdentity(args) {
        return __awaiter(this, void 0, void 0, function* () {
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
            }
            catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify({ success: false, error: error.message }, null, 2)
                        }]
                };
            }
        });
    }
    handleUpdateIdentity(args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = args, changes = __rest(args, ["id"]);
                const updated = yield this.storage.update(id, changes);
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
            }
            catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify({ success: false, error: error.message }, null, 2)
                        }]
                };
            }
        });
    }
    handleDeleteIdentity(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const success = yield this.storage.delete(args.id);
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify({ success }, null, 2)
                    }]
            };
        });
    }
    handleGenerateOfficialDoc(args) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const SERVER_URL = "http://123.206.222.58:4900";
            try {
                const docData = {
                    wordTemplate: {
                        wordCellList: args.elements,
                        baseData: {},
                        baseWordConfig: args.config || {
                            lineHeightNumber: 25,
                            lineNumber: 26,
                            tabIndexNumber: 2
                        },
                        file: {
                            Author: "智能助手",
                            fileName: args.fileName || "official_document.doc"
                        }
                    }
                };
                console.log('正在创建文档...');
                console.log(`请求URL: ${SERVER_URL}/docMaker/makeDocByTemplate`);
                console.log('请求数据:', JSON.stringify(docData, null, 2));
                // 创建文档
                const createResponse = yield axios_1.default.post(`${SERVER_URL}/docMaker/makeDocByTemplate`, docData, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                });
                const docId = (_b = (_a = createResponse.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.id;
                if (!docId) {
                    console.error('API响应:', createResponse.data);
                    throw new Error('无法获取文档ID，请检查API响应格式');
                }
                console.log('文档创建成功，ID:', docId);
                console.log('正在下载文档...');
                // 下载文档
                const downloadResponse = yield axios_1.default.get(`${SERVER_URL}/docMaker/getFileById/${docId}`, {
                    responseType: 'arraybuffer',
                    timeout: 30000
                });
                const fileName = args.fileName || 'official_document.doc';
                console.log('文档下载成功:', fileName);
                const filePath = path_1.default.join(__dirname, '../build/documents', fileName);
                yield fs_1.promises.mkdir(path_1.default.dirname(filePath), { recursive: true });
                yield fs_1.promises.writeFile(filePath, downloadResponse.data);
                const fileContent = yield fs_1.promises.readFile(filePath);
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify({
                                success: true,
                                filePath: filePath,
                                fileName: fileName
                            }, null, 2)
                        }]
                };
            }
            catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify({ success: false, error: error.message }, null, 2)
                        }],
                    isError: true
                };
            }
        });
    }
    handleListIdentities() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const identities = this.storage.list();
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify({ success: true, data: identities }, null, 2)
                        }]
                };
            }
            catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify({ success: false, error: error.message }, null, 2)
                        }]
                };
            }
        });
    }
    handleChat(args) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const streamHandler = new StreamHandler_1.StreamHandler(identity.chatConfig.apiKey, identity.chatConfig.model, identity.chatConfig.timeout);
                return new Promise((resolve) => {
                    let fullResponse = '';
                    let messages = args.messages;
                    // 创建新的聊天记录
                    const chatRecord = {
                        id: (0, uuid_1.v4)(),
                        messages: [...messages],
                        timestamp: new Date().toISOString()
                    };
                    streamHandler.on('data', (data) => {
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
                    streamHandler.on('end', () => __awaiter(this, void 0, void 0, function* () {
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
                                if (!latestIdentity)
                                    return;
                                // 保存聊天记录
                                console.log('正在保存聊天记录...');
                                const updatedWithHistory = yield this.storage.update(args.identityId, {
                                    chatHistory: [...(latestIdentity.chatHistory || []), chatRecord]
                                });
                                console.log('聊天记录保存结果:', updatedWithHistory ? '成功' : '失败');
                                // 保存记忆
                                const keywords = yield streamHandler.extractKeywords(fullResponse);
                                const memory = {
                                    id: (0, uuid_1.v4)(),
                                    content: fullResponse,
                                    keywords,
                                    timestamp: new Date().toISOString(),
                                    context: {
                                        conversationId: args.identityId
                                    }
                                };
                                console.log('正在保存记忆...');
                                const updatedWithMemory = yield this.storage.update(args.identityId, {
                                    memories: [...(latestIdentity.memories || []), memory]
                                });
                                console.log('记忆保存结果:', updatedWithMemory ? '成功' : '失败');
                            }
                        }
                        catch (e) {
                            console.error('Failed to save chat history or memory:', e);
                        }
                        resolve({
                            content: [{
                                    type: 'text',
                                    text: JSON.stringify({ success: true, data: fullResponse }, null, 2)
                                }]
                        });
                    }));
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
            }
            catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify({ success: false, error: error.message }, null, 2)
                        }]
                };
            }
        });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const transport = new stdio_js_1.StdioServerTransport();
            yield this.server.connect(transport);
            console.error('Identity MCP Server running on stdio');
        });
    }
}
const server = new IdentityServer();
server.run().catch((error) => console.error(error));
