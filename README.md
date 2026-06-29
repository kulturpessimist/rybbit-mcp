# rybbit-mcp

An [MCP](https://modelcontextprotocol.io) server that exposes [Rybbit Analytics](https://rybbit.com) as tools for Claude (or any MCP-compatible client). Ask Claude things like:

- "What's the traffic overview for my site this week?"
- "What are the top 10 pages by visits this month?"
- "How many people are on the site right now?"
- "Where is my traffic coming from, by country?"
- "Show me the most recent sessions from mobile users."

It works against both **Rybbit Cloud** (`app.rybbit.io`) and **self-hosted** Rybbit instances.

## Tools

| Tool | Description |
|---|---|
| `rybbit_list_sites` | List organizations and sites (with their site IDs) |
| `rybbit_get_site` | Get config/details for one site |
| `rybbit_get_overview` | Sessions, pageviews, users, bounce rate, duration for a time range |
| `rybbit_get_overview_timeseries` | Same metrics bucketed over time (for trend charts) |
| `rybbit_get_breakdown` | Top pages, referrers, countries, browsers, devices, UTM params, etc. |
| `rybbit_get_live_visitors` | Current active visitor count |
| `rybbit_list_sessions` | Paginated list of visitor sessions |
| `rybbit_get_session` | Full detail + event list for one session |
| `rybbit_get_session_locations` | Aggregated session geolocation, for mapping |

This covers Rybbit's Overview and Sessions API families. The same client/tool pattern can be extended to Events, Users, Goals, Funnels, Performance, and Errors — see [Extending](#extending) below.

## Setup

### 1. Get a Rybbit API key

In your Rybbit dashboard: **Settings → Account → API Keys** → Create.

> Self-hosted instances have no rate limits. Rybbit Cloud rate-limits API keys per your plan (Standard: 20 req/min, Pro: 200 req/min); Free/Basic plans don't get API key access.

### 2. Build the server

```bash
git clone https://github.com/<your-username>/rybbit-mcp.git
cd rybbit-mcp
npm install
npm run build
```

This produces `build/index.js`.

### 3. Configure your MCP client

**Claude Desktop / Claude Code** — add to your MCP config (`claude_desktop_config.json` or `.claude/settings.json`):

```json
{
  "mcpServers": {
    "rybbit": {
      "command": "node",
      "args": ["/absolute/path/to/rybbit-mcp/build/index.js"],
      "env": {
        "RYBBIT_URL": "https://app.rybbit.io",
        "RYBBIT_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

If you self-host Rybbit, set `RYBBIT_URL` to your instance's base URL instead (e.g. `https://analytics.yourdomain.com`).

Restart Claude Desktop / reload Claude Code, and the `rybbit_*` tools should appear.

### Deploying to CapRover (or Docker)

This MCP server supports Server-Sent Events (SSE) for remote clients over HTTP. This is perfect for deploying to a platform like CapRover so that a remote AI agent can access the tools.

1. Create a new App in your CapRover dashboard (e.g., `rybbit-mcp`).
2. Set the Environment Variables in CapRover:
   - `RYBBIT_URL`
   - `RYBBIT_API_KEY`
   - `MCP_TOKEN`
   - `PORT=3000` (Optional, defaults to 3000)
3. Under the Deployment tab, deploy using the **Captain Definition** or simply push this repository via the CapRover CLI. This repository contains a `Dockerfile` that CapRover will automatically detect and build.

Once deployed, the SSE endpoint will be available at:
`https://rybbit-mcp.your-caprover-domain.com/sse`

Your remote AI agents can connect to this URL via `SSEServerTransport` instead of `stdio`. Tool call requests sent to `/messages` must include the configured bearer token:

```http
Authorization: Bearer your-mcp-token-here
```

### 4. Try it

> "Use rybbit to show me an overview of site 123 for the last 7 days"
> "What are the top pages on my site this month?"
> "How many live visitors do I have right now?"

## Development

```bash
npm run watch       # recompile on change
npm run inspector    # open the MCP Inspector against this server
```

## Extending

Rybbit's API has more endpoint families than this v1 covers (Events, Users, Goals, Funnels, Performance metrics, Errors — see the [Rybbit API docs](https://rybbit.com/docs/api/getting-started)). To add one:

1. Add a method to `src/rybbit-client.ts` calling the endpoint.
2. Register a corresponding tool in `src/index.ts` with `server.registerTool(...)`, using `zod` for the input schema.
3. `npm run build` and reload your MCP client.

## License

MIT
