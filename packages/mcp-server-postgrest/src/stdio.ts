#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { parseArgs } from 'node:util';
import PostgrestMcpServer from './server.js';

async function main() {
  console.error('Starting MCP server...');

  const {
    values: { apiUrl, apiKey, schema },
  } = parseArgs({
    options: {
      apiUrl: {
        type: 'string',
      },
      apiKey: {
        type: 'string',
      },
      schema: {
        type: 'string',
      },
    },
  });

  console.error('Args parsed:', { apiUrl, schema });

  if (!apiUrl) {
    console.error('Please provide a base URL with the --apiUrl flag');
    process.exit(1);
  }

  if (!schema) {
    console.error('Please provide a schema with the --schema flag');
    process.exit(1);
  }

  try {
    console.error('Creating server instance...');
    const server = new PostgrestMcpServer({
      apiUrl,
      apiKey,
      schema,
    });

    console.error('Creating transport...');
    const transport = new StdioServerTransport();

    console.error('Connecting server to transport...');
    await server.connect(transport);
    console.error('Server connected successfully!');
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

main().catch(console.error);
