import dotenv from "dotenv";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { actorFromToken, backendMongoose, createCafeServer } from "./server.js";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

async function connectDatabase() {
  if (!process.env.MONGO_URL) throw new Error("MONGO_URL is required");
  await backendMongoose.connect(process.env.MONGO_URL);
}

async function stdio() {
  await connectDatabase();
  let actor = null;
  if (process.env.MCP_ACTOR_TOKEN) actor = actorFromToken(process.env.MCP_ACTOR_TOKEN);
  const server = createCafeServer(actor);
  await server.connect(new StdioServerTransport());
  console.error("Bake N Brew MCP server connected over stdio");
}

async function http() {
  await connectDatabase();
  const port = Number(process.env.MCP_PORT || 8001);
  const host = process.env.MCP_HOST || "127.0.0.1";
  const app = createServer(async (req, res) => {
    if (req.url === "/health") {
      const connected = backendMongoose.connection.readyState === 1;
      res.writeHead(connected ? 200 : 503, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: connected ? "ok" : "degraded", database: connected ? "connected" : "disconnected" }));
      return;
    }
    if (req.url !== "/mcp") {
      res.writeHead(404).end("Not found");
      return;
    }
    try {
      const auth = req.headers.authorization;
      const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
      const actor = token ? actorFromToken(token) : null;
      const server = createCafeServer(actor);
      const transport = new NodeStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      res.on("close", () => { transport.close(); server.close(); });
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error: any) {
      if (!res.headersSent) {
        res.writeHead(401, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: error.message || "Unauthorized" }));
      }
    }
  });
  app.listen(port, host, () => console.error(`Bake N Brew MCP listening at http://${host}:${port}/mcp`));
  const shutdown = async (signal: string) => {
    console.error(`${signal} received, shutting down`);
    app.close(async () => {
      await backendMongoose.disconnect();
      process.exit(0);
    });
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

(process.argv[2] === "stdio" ? stdio() : http()).catch((error) => {
  console.error(error);
  process.exit(1);
});
