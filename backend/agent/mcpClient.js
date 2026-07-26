const MCP_URL = process.env.MCP_HTTP_URL || "http://127.0.0.1:8001/mcp";
const toolCache = new Map();

async function connectedClient(token) {
  const { Client, StreamableHTTPClientTransport } = await import("@modelcontextprotocol/client");
  const authorizedFetch = (input, init = {}) => {
    const headers = new Headers(init.headers);
    if (token) headers.set("authorization", `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  };
  const client = new Client({ name: "brewbake-express-agent", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), { fetch: authorizedFetch });
  await client.connect(transport);
  return client;
}

async function listTools(token, cacheKey) {
  const cached = toolCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.tools;
  const client = await connectedClient(token);
  try {
    const { tools } = await client.listTools();
    toolCache.set(cacheKey, { tools, expiresAt: Date.now() + 60_000 });
    return tools;
  } finally {
    await client.close();
  }
}

async function callTool(token, name, args) {
  const client = await connectedClient(token);
  try {
    return await client.callTool({ name, arguments: args || {} });
  } finally {
    await client.close();
  }
}

module.exports = { listTools, callTool };
