/*
 * @Date: 2025-05-12 03:21:53
 * @LastEditors: CZH
 * @LastEditTime: 2025-05-12 04:08:41
 * @FilePath: /identity-mcp-server/src/chat/GLM4Adapter.ts
 */
import { EventEmitter } from 'events';
import axios, { AxiosRequestConfig } from 'axios';
import { MemoryItem } from '../types';

interface GLM4Message {
    role: 'user' | 'assistant';
    content: string;
}

interface GLM4Request {
    model: string;
    messages: GLM4Message[];
    stream: boolean;
    temperature?: number;
}

export class GLM4Adapter extends EventEmitter {
    private readonly apiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
    private readonly apiKey: string;
    private readonly model: string;
    private readonly timeout: number;

    constructor(config: {
        apiKey: string;
        model?: string;
        timeout?: number;
    }) {
        super();
        this.apiKey = config.apiKey;
        this.model = config.model || 'glm-4-flash-250414';
        this.timeout = config.timeout || 30000;
    }

    public async createStreamingChat(messages: GLM4Message[], temperature?: number) {
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
            },
            responseType: 'stream',
        };

        const data: GLM4Request = {
            model: this.model,
            messages,
            stream: true,
            temperature,
        };

        try {
            const response = await axios.post(this.apiUrl, data, config);
            let buffer = '';
            response.data.on('data', (chunk: Buffer) => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const eventData = line.substring(6).trim();
                        if (eventData === '[DONE]') continue;

                        try {
                            if (eventData.trim() === '') continue;
                            const parsed = JSON.parse(eventData);
                            if (parsed.choices && parsed.choices[0]?.delta?.content) {
                                this.emit('data', parsed.choices[0].delta.content);
                            }
                        } catch (e) {
                            if (eventData !== '[DONE]') {
                                this.emit('error', new Error(`Invalid event data: ${eventData}`));
                            }
                        }
                    }
                }
            });

            response.data.on('end', () => this.emit('end'));
            response.data.on('error', (err: Error) => this.emit('error', err));
        } catch (error) {
            this.emit('error', error);
        }
    }

    public async extractKeywords(content: string): Promise<string[]> {
        const config: AxiosRequestConfig = {
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
            const response = await axios.post(this.apiUrl, data, config);
            const result = response.data.choices[0].message.content;
            return JSON.parse(result);
        } catch (error) {
            console.error('关键词提取失败:', error);
            return [];
        }
    }
}
