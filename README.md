# Gemini Search MCP Server

Gemini APIとGoogle検索を使用して、最新の情報に基づいた回答を生成するMCPサーバーです。

## 機能

### Tools
- `search` - Gemini 2.0とGoogle検索を使用して質問に回答
  - クエリを入力として受け取り、Geminiの回答と関連する検索結果を返します

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
