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
exports.GLM4Adapter = void 0;
/*
 * @Date: 2025-05-12 03:21:53
 * @LastEditors: CZH
 * @LastEditTime: 2025-05-12 04:08:41
 * @FilePath: /identity-mcp-server/src/chat/GLM4Adapter.ts
 */
const events_1 = require("events");
const axios_1 = __importDefault(require("axios"));
class GLM4Adapter extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.apiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
        this.apiKey = config.apiKey;
        this.model = config.model || 'glm-4-flash-250414';
        this.timeout = config.timeout || 30000;
    }
    createStreamingChat(messages, temperature) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                },
                responseType: 'stream',
            };
            const data = {
                model: this.model,
                messages,
                stream: true,
                temperature,
            };
            try {
                const response = yield axios_1.default.post(this.apiUrl, data, config);
                let buffer = '';
                response.data.on('data', (chunk) => {
                    var _a, _b;
                    buffer += chunk.toString();
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const eventData = line.substring(6).trim();
                            if (eventData === '[DONE]')
                                continue;
                            try {
                                if (eventData.trim() === '')
                                    continue;
                                const parsed = JSON.parse(eventData);
                                if (parsed.choices && ((_b = (_a = parsed.choices[0]) === null || _a === void 0 ? void 0 : _a.delta) === null || _b === void 0 ? void 0 : _b.content)) {
                                    this.emit('data', parsed.choices[0].delta.content);
                                }
                            }
                            catch (e) {
                                if (eventData !== '[DONE]') {
                                    this.emit('error', new Error(`Invalid event data: ${eventData}`));
                                }
                            }
                        }
                    }
                });
                response.data.on('end', () => this.emit('end'));
                response.data.on('error', (err) => this.emit('error', err));
            }
            catch (error) {
                this.emit('error', error);
            }
        });
    }
    extractKeywords(content) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
            };
            const data = {
                model: this.model,
                messages: [{
                        role: 'user',
                        content: `提取以下内容的关键词(3-5个):\n${content}\n请用JSON格式返回关键词数组`
                    }],
                temperature: 0.3,
            };
            try {
                const response = yield axios_1.default.post(this.apiUrl, data, config);
                const result = response.data.choices[0].message.content;
                return JSON.parse(result);
            }
            catch (error) {
                console.error('关键词提取失败:', error);
                return [];
            }
        });
    }
}
exports.GLM4Adapter = GLM4Adapter;
