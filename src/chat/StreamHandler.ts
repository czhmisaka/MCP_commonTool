/*
 * @Date: 2025-05-12 03:22:48
 * @LastEditors: CZH
 * @LastEditTime: 2025-05-12 04:11:04
 * @FilePath: /identity-mcp-server/src/chat/StreamHandler.ts
 */
import { EventEmitter } from 'events';
import { GLM4Adapter } from './GLM4Adapter';
import { ChatMessage } from '../types';

export class StreamHandler extends EventEmitter {
    private adapter: GLM4Adapter;
    private messages: ChatMessage[] = [];
    private timeout: number;

    constructor(apiKey: string, model: string, timeout: number = 30000) {
        super();
        this.adapter = new GLM4Adapter({
            apiKey,
            model,
            timeout
        });
        this.timeout = timeout;

        this.adapter.on('data', (data: string) => {
            this.emit('data', data);
        });

        this.adapter.on('error', (err: Error) => {
            this.emit('error', err);
        });

        this.adapter.on('end', () => {
            this.emit('end');
        });
    }

    public async startStream(messages: ChatMessage[], temperature?: number) {
        const timer = setTimeout(() => {
            this.emit('error', new Error('Stream timeout'));
            this.emit('end');
        }, this.timeout);

        this.once('end', () => clearTimeout(timer));

        try {
            await this.adapter.createStreamingChat(
                messages.map(m => ({
                    role: m.role as 'user' | 'assistant',
                    content: m.content
                })),
                temperature
            );
        } catch (err) {
            this.emit('error', err);
            this.emit('end');
        }
    }

    public addMessage(message: ChatMessage) {
        this.messages.push(message);
    }

    public getHistory(): ChatMessage[] {
        return [...this.messages];
    }

    public async extractKeywords(text: string): Promise<string[]> {
        return this.adapter.extractKeywords(text);
    }
}
