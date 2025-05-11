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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamHandler = void 0;
/*
 * @Date: 2025-05-12 03:22:48
 * @LastEditors: CZH
 * @LastEditTime: 2025-05-12 04:11:04
 * @FilePath: /identity-mcp-server/src/chat/StreamHandler.ts
 */
const events_1 = require("events");
const GLM4Adapter_1 = require("./GLM4Adapter");
class StreamHandler extends events_1.EventEmitter {
    constructor(apiKey, model, timeout = 30000) {
        super();
        this.messages = [];
        this.adapter = new GLM4Adapter_1.GLM4Adapter({
            apiKey,
            model,
            timeout
        });
        this.timeout = timeout;
        this.adapter.on('data', (data) => {
            this.emit('data', data);
        });
        this.adapter.on('error', (err) => {
            this.emit('error', err);
        });
        this.adapter.on('end', () => {
            this.emit('end');
        });
    }
    startStream(messages, temperature) {
        return __awaiter(this, void 0, void 0, function* () {
            const timer = setTimeout(() => {
                this.emit('error', new Error('Stream timeout'));
                this.emit('end');
            }, this.timeout);
            this.once('end', () => clearTimeout(timer));
            try {
                yield this.adapter.createStreamingChat(messages.map(m => ({
                    role: m.role,
                    content: m.content
                })), temperature);
            }
            catch (err) {
                this.emit('error', err);
                this.emit('end');
            }
        });
    }
    addMessage(message) {
        this.messages.push(message);
    }
    getHistory() {
        return [...this.messages];
    }
    extractKeywords(text) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.extractKeywords(text);
        });
    }
}
exports.StreamHandler = StreamHandler;
