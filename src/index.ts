#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1alpha/models';
const MODEL_ID = 'gemini-2.0-flash-exp';

class GeminiSearchServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'gemini-search-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // エラーハンドリング
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'search',
          description: 'Gemini 2.0とGoogle検索を使用して、最新の情報に基づいた回答を生成',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '検索クエリ',
              }
            },
            required: ['query'],
          },
        },
      ],
    }));

    interface SearchArgs {
      query: string;
    }

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'search') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      if (!request.params.arguments || typeof request.params.arguments.query !== 'string') {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Query parameter is required and must be a string'
        );
      }

      const args: SearchArgs = {
        query: request.params.arguments.query
      };

      try {
        const response = await axios.post(
          `${API_ENDPOINT}/${MODEL_ID}:generateContent?key=${GEMINI_API_KEY}`,
          {
            contents: [{
              role: 'user',
              parts: [{
                text: args.query
              }]
            }],
            tools: [{
              google_search: {}
            }]
          }
        );

        const text = response.data.candidates[0].content.parts[0].text;
        const searchResults = response.data.candidates[0]?.grounding_metadata?.search_entry_point?.rendered_content || '';

        let finalText = text;
        if (searchResults) {
          finalText += '\n\n検索結果:\n' + searchResults;
        }

        return {
          content: [
            {
              type: 'text',
              text: finalText,
            },
          ],
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
        console.error('Gemini API error:', errorMessage);
        return {
          content: [
            {
              type: 'text',
              text: `エラーが発生しました: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Gemini Search MCP server running on stdio');
  }
}

const server = new GeminiSearchServer();
server.run().catch(console.error);
