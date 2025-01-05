# Gemini Search MCP Server

[![MCP Server](https://glama.io/mcp-servers/badge/Lorhlona/geminiserchMCP)](https://glama.io/mcp-servers/Lorhlona/geminiserchMCP)

An MCP server that generates responses based on the latest information using the Gemini API and Google Search.

> **Note**: This MCP server does not work standalone. It needs to be used in combination with AI assistants like [Cline](https://github.com/ClineLabs/cline). The Gemini search functionality becomes available when you load this project into an AI assistant.

---

Gemini APIとGoogle検索を使用して、最新の情報に基づいた回答を生成するMCPサーバーです。

> **注意**: このMCPサーバーは単体では動作しません。[Cline](https://github.com/ClineLabs/cline)などのAIアシスタントと組み合わせて使用する必要があります。AIアシスタントにこのプロジェクトを読み込ませることで、Gemini検索機能が利用可能になります。

## Features

### Tools
- `search` - Generate answers using Gemini 2.0 and Google Search
  - Takes a query as input and returns Gemini's response along with relevant search results

## 機能

### Tools
- `search` - Gemini 2.0とGoogle検索を使用して質問に回答
  - クエリを入力として受け取り、Geminiの回答と関連する検索結果を返します

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build:
```bash
npm run build
```

3. Set environment variables:
Create a `.env` file in the project root with the following content:
```
GEMINI_API_KEY=your_api_key_here
```
Note: You can get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

## Development

For automatic builds during development:
```bash
npm run watch
```

## Installation

To use with Claude Desktop, add the following configuration:

Windows: `%APPDATA%/Claude/claude_desktop_config.json`
```json
{
  "mcpServers": {
    "gemini": {
      "command": "node",
      "args": ["path/to/gemini-search-server/build/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Debugging

Since MCP servers communicate via stdio, we recommend using [MCP Inspector](https://github.com/modelcontextprotocol/inspector) for debugging:

```bash
npm run inspector
```

The Inspector provides a URL to access debugging tools in your browser.

## License

The code in this project is released under the [MIT License](LICENSE).
However, please note that this project uses the Google Gemini API, which is subject to [Google's Terms of Service](https://ai.google.dev/terms). When using this MCP server, you must comply with both the MIT License for our code and Google's terms for the Gemini API.

---

## セットアップ

1. 依存関係のインストール:
```bash
npm install
```

2. ビルド:
```bash
npm run build
```

3. 環境変数の設定:
`.env`ファイルをプロジェクトのルートに作成し、以下の内容を設定してください：
```
GEMINI_API_KEY=your_api_key_here
```
※ Gemini APIキーは[Google AI Studio](https://makersuite.google.com/app/apikey)から取得できます。

## 開発

開発時の自動ビルド:
```bash
npm run watch
```

## インストール

Claude Desktopで使用するには、以下の設定を追加してください：

Windows: `%APPDATA%/Claude/claude_desktop_config.json`
```json
{
  "mcpServers": {
    "gemini": {
      "command": "node",
      "args": ["path/to/gemini-search-server/build/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### デバッグ

MCPサーバーはstdioを介して通信するため、デバッグには[MCP Inspector](https://github.com/modelcontextprotocol/inspector)の使用を推奨します：

```bash
npm run inspector
```

InspectorはブラウザでデバッグツールにアクセスするためのURLを提供します。

## ライセンス

このプロジェクトのコードは[MIT License](LICENSE)の下で公開されています。
ただし、このプロジェクトはGoogle Gemini APIを使用しているため、[Googleの利用規約](https://ai.google.dev/terms)も適用されます。このMCPサーバーを使用する際は、コードのMITライセンスとGemini APIの利用規約の両方に従う必要があります。
