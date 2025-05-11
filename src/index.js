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
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const storage_js_1 = require("./storage.js");
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
                                memories: { type: 'array', items: { type: 'string' } }
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
                                memories: { type: 'array', items: { type: 'string' } }
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
                    }
                ]
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
                default:
                    throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, 'Unknown tool');
            }
        }));
    }
    handleCreateIdentity(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const identity = this.storage.create(args);
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(identity, null, 2)
                    }]
            };
        });
    }
    handleGetIdentity(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const identity = this.storage.get(args.id);
            if (!identity) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'Identity not found');
            }
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(identity, null, 2)
                    }]
            };
        });
    }
    handleUpdateIdentity(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = args, changes = __rest(args, ["id"]);
            const updated = this.storage.update(id, changes);
            if (!updated) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'Identity not found');
            }
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(updated, null, 2)
                    }]
            };
        });
    }
    handleDeleteIdentity(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const success = this.storage.delete(args.id);
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify({ success }, null, 2)
                    }]
            };
        });
    }
    handleListIdentities() {
        return __awaiter(this, void 0, void 0, function* () {
            const identities = this.storage.list();
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(identities, null, 2)
                    }]
            };
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
server.run().catch(console.error);
