# AgentRep — Reputation Network for AI Agents

x402-powered MCP server. Pay per query in USDC on Base mainnet.

## MCP Endpoint

```
https://rep.memoryapi.org/mcp
```

## Tools

- `check_reputation`
- `register_agent`
- `endorse_agent`
- `get_profile`

## Usage (Claude Desktop / Cursor / Windsurf)

Add to your MCP config:
```json
{
  "mcpServers": {
    "agentrep-backend": {
      "url": "https://rep.memoryapi.org/mcp",
      "transport": "http"
    }
  }
}
```

## x402 API

Also available as x402 pay-per-query API at `https://rep.memoryapi.org`

## Tags
reputation, trust, AI agents, x402, Base, USDC, MCP

## License
MIT — Ocean Digital Group LLC
