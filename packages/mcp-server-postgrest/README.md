# @supabase/mcp-server-postgrest

This is a Windsurf-optimized MCP server for [PostgREST](https://postgrest.org). It allows LLMs to perform database queries and operations on Postgres databases via PostgREST.

This server works with both Supabase projects (which use PostgREST) and standalone PostgREST servers.

## Windsurf Modifications

This fork includes several enhancements for optimal integration with Windsurf:

1. Enhanced Error Handling:
   - Improved error messages for better debugging
   - Added structured error responses for LLM consumption
   - Better handling of malformed SQL queries

2. Response Formatting:
   - Standardized response format for consistent parsing
   - Added metadata for UI component generation
   - Improved type safety throughout

3. SQL to REST Improvements:
   - Enhanced SQL query parsing
   - Better handling of complex queries
   - Added support for more SQL operations

4. Authentication:
   - Flexible API key handling
   - Support for bearer token authentication
   - Improved header management

## Tools

The following tools are available:

### `postgrestRequest`

Performs an HTTP request to a [configured](#usage) PostgREST server. It accepts the following arguments:

- `method`: The HTTP method to use (eg. `GET`, `POST`, `PATCH`, `DELETE`)
- `path`: The path to query (eg. `/todos?id=eq.1`)
- `body`: The request body (for `POST` and `PATCH` requests)

It returns the JSON response from the PostgREST server, including selected rows for `GET` requests and updated rows for `POST` and `PATCH` requests.

### `sqlToRest`

Converts a SQL query to the equivalent PostgREST syntax (as method and path). Useful for complex queries that LLMs would otherwise struggle to convert to valid PostgREST syntax.

Note that PostgREST only supports a subset of SQL, so not all queries will convert. See [`sql-to-rest`](https://github.com/supabase-community/sql-to-rest) for more details.

It accepts the following arguments:

- `sql`: The SQL query to convert.

It returns an object containing `method` and `path` properties for the request. LLMs can then use the `postgrestRequest` tool to execute the request.

## Usage

### With Claude Desktop

[Claude Desktop](https://claude.ai/download) is a popular LLM client that supports the Model Context Protocol. You can connect your PostgREST server to Claude Desktop to query your database via natural language commands.

You can add MCP servers to Claude Desktop via its config file at:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

- Windows:`%APPDATA%\Claude\claude_desktop_config.json`

To add your Supabase project _(or any PostgREST server)_ to Claude Desktop, add the following configuration to the `servers` array in the config file:

```json
{
  "mcpServers": {
    "todos": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-postgrest",
        "--apiUrl",
        "https://your-project-ref.supabase.co/rest/v1",
        "--apiKey",
        "your-anon-key",
        "--schema",
        "public"
      ]
    }
  }
}
```

#### Configuration

- `apiUrl`: The base URL of your PostgREST endpoint

- `apiKey`: Your API key for authentication _(optional)_

- `schema`: The Postgres schema to serve the API from (eg. `public`). Note any non-public schemas must be manually exposed from PostgREST.

### Programmatically (custom MCP client)

If you're building your own MCP client, you can connect to a PostgREST server programmatically using your preferred transport. The [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) offers built-in [stdio](https://modelcontextprotocol.io/docs/concepts/transports#standard-input-output-stdio) and [SSE](https://modelcontextprotocol.io/docs/concepts/transports#server-sent-events-sse) transports. We also offer a [`StreamTransport`](../mcp-utils#streamtransport) if you wish to directly connect to MCP servers in-memory or by piping over your own stream-based transport.

#### Installation

```bash
npm i @supabase/mcp-server-postgrest
```

```bash
yarn add @supabase/mcp-server-postgrest
```

```bash
pnpm add @supabase/mcp-server-postgrest
```

#### Example

The following example uses the [`StreamTransport`](../mcp-utils#streamtransport) to connect directly between an MCP client and server.

```ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamTransport } from '@supabase/mcp-utils';
import { PostgrestMcpServer } from '@supabase/mcp-server-postgrest';

// Create a stream transport for both client and server
const clientTransport = new StreamTransport();
const serverTransport = new StreamTransport();

// Connect the streams together
clientTransport.readable.pipeTo(serverTransport.writable);
serverTransport.readable.pipeTo(clientTransport.writable);

const client = new Client(
  {
    name: 'MyClient',
    version: '0.1.0',
  },
  {
    capabilities: {},
  }
);

const supabaseUrl = 'https://your-project-ref.supabase.co'; // http://127.0.0.1:54321 for local
const apiKey = 'your-anon-key'; // or service role, or user JWT
const schema = 'public'; // or any other exposed schema

const server = new PostgrestMcpServer({
  apiUrl: `${supabaseUrl}/rest/v1`,
  apiKey,
  schema,
});

// Connect the client and server to their respective transports
await server.connect(serverTransport);
await client.connect(clientTransport);

// Call tools, etc
const output = await client.callTool({
  name: 'postgrestRequest',
  arguments: {
    method: 'GET',
    path: '/todos',
  },
});
```
