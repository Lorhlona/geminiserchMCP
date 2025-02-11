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
import fs from 'fs/promises';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1alpha/models';
const MODEL_ID = 'gemini-2.0-flash-exp';

interface SearchArgs {
  query: string;
}

interface AnalyzeFileArgs {
  file_path: string;
  query?: string;
}

interface AnalyzeFilesArgs {
  file_paths: string[];
  query?: string;
}

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
        {
          name: 'analyze_file',
          description: 'Gemini 2.0のマルチモーダル機能を使用してファイル（画像、PDF）を分析',
          inputSchema: {
            type: 'object',
            properties: {
              file_path: {
                type: 'string',
                description: 'ファイルパス（画像またはPDF）',
              },
              query: {
                type: 'string',
                description: 'ファイルに対する質問や指示（オプション）',
              }
            },
            required: ['file_path'],
          },
        },
        {
          name: 'analyze_files',
          description: '複数のファイルを同時に分析し、内容の整合性を確認',
          inputSchema: {
            type: 'object',
            properties: {
              file_paths: {
                type: 'array',
                items: {
                  type: 'string',
                  description: 'ファイルパス（画像またはPDF）',
                },
                description: '分析するファイルのパス一覧',
              },
              query: {
                type: 'string',
                description: 'ファイルに対する質問や指示（オプション）',
              }
            },
            required: ['file_paths'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'search':
          return await this.handleSearch(request);
        case 'analyze_file':
          return await this.handleAnalyzeFile(request);
        case 'analyze_files':
          return await this.handleAnalyzeFiles(request);
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  private async handleSearch(request: any) {
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
  }

  private async handleAnalyzeFile(request: any) {
    if (!request.params.arguments || typeof request.params.arguments.file_path !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'File path parameter is required and must be a string'
      );
    }

    const args: AnalyzeFileArgs = {
      file_path: request.params.arguments.file_path,
      query: request.params.arguments.query || 'このファイルの内容を分析して説明してください。'
    };

    try {
      const fileData = await fs.readFile(args.file_path);
      const base64Data = fileData.toString('base64');
      const mimeType = args.file_path.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';

      const response = await axios.post(
        `${API_ENDPOINT}/${MODEL_ID}:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            role: 'user',
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              },
              {
                text: args.query
              }
            ]
          }]
        }
      );

      return {
        content: [
          {
            type: 'text',
            text: response.data.candidates[0].content.parts[0].text,
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
  }

  private async handleAnalyzeFiles(request: any) {
    if (!request.params.arguments || !Array.isArray(request.params.arguments.file_paths)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'file_paths parameter is required and must be an array of strings'
      );
    }

    const args: AnalyzeFilesArgs = {
      file_paths: request.params.arguments.file_paths,
      query: request.params.arguments.query || 'これらのファイルの内容を分析し、整合性を確認してください。'
    };

    try {
      // 全てのファイルを読み込んでBase64エンコードまたはテキストとして処理
      const fileContents = await Promise.all(
        args.file_paths.map(async (filePath: string) => {
          const fileData = await fs.readFile(filePath);
          const isMarkdown = filePath.toLowerCase().endsWith('.md');
          
          if (isMarkdown) {
            // Markdownファイルはテキストとして処理
            return {
              text: fileData.toString('utf-8')
            };
          } else {
            // PDFや画像はBase64エンコード
            const base64Data = fileData.toString('base64');
            const mimeType = filePath.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
            return {
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            };
          }
        })
      );

      // Gemini APIにリクエスト
      const response = await axios.post(
        `${API_ENDPOINT}/${MODEL_ID}:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            role: 'user',
            parts: [
              ...fileContents,
              {
                text: args.query
              }
            ]
          }]
        }
      );

      return {
        content: [
          {
            type: 'text',
            text: response.data.candidates[0].content.parts[0].text,
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
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Gemini Search MCP server running on stdio');
  }
}

const server = new GeminiSearchServer();
server.run().catch(console.error);
