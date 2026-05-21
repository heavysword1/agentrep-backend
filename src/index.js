require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), override: true });
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { paymentMiddleware, x402ResourceServer } = require('@x402/express');
const { bazaarResourceServerExtension } = require('@x402/extensions');
const { ExactEvmScheme } = require('@x402/evm/exact/server');
const { HTTPFacilitatorClient } = require('@x402/core/server');

const registerRouter = require('./routes/register');
const scoreRouter = require('./routes/score');
const endorseRouter = require('./routes/endorse');
const reportRouter = require('./routes/report');
const profileRouter = require('./routes/profile');

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '50kb' }));

const PAY_TO = process.env.X402_WALLET_ADDRESS || '0x24FAcafEB49b4e3FACF0B3e69604A2F4640c9bf2';
const X402_NETWORK = 'eip155:8453';
const PORT = process.env.PORT || 3002;

// Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
app.locals.supabase = supabase;

// Health check
app.get('/', (req, res) => res.json({
  status: 'ok', service: 'AgentRep', version: '1.0.0',
  description: 'Reputation network for AI agents — x402 on Base mainnet',
  endpoints: {
    register: 'POST /x402/rep/register — Register an agent ($0.01)',
    score:    'GET  /x402/rep/score   — Query reputation score ($0.001)',
    endorse:  'POST /x402/rep/endorse — Endorse an agent ($0.005)',
    report:   'POST /x402/rep/report  — Report bad behavior ($0.005)',
    profile:  'GET  /x402/rep/profile — Full agent profile ($0.001)'
  }
}));

// OpenAPI
app.get('/openapi.json', (req, res) => res.sendFile(require('path').join(__dirname, 'openapi.json')));

// Favicon
app.get('/favicon.ico', (req, res) => res.redirect('https://memoryapi.org/favicon.ico'));

// x402 setup
try {
  const { createFacilitatorConfig } = require('@coinbase/x402');
  const rawConfig = createFacilitatorConfig(process.env.CDP_API_KEY_NAME, process.env.CDP_API_KEY_PRIVATE_KEY);
  const facilitatorClient = new HTTPFacilitatorClient({ url: rawConfig.url, createAuthHeaders: rawConfig.createAuthHeaders });

  const x402Server = new x402ResourceServer(facilitatorClient)
    .register(X402_NETWORK, new ExactEvmScheme())
    .registerExtension(bazaarResourceServerExtension);

  app.use(paymentMiddleware(
    {
      'GET /x402/rep/register': {
        accepts: [{ scheme: 'exact', price: '$0.01', network: X402_NETWORK, payTo: PAY_TO }],
        description: 'Register an AI agent and create a reputation profile',
        extensions: { bazaar: { info: {
          input: { type: 'http', method: 'GET', queryParams: { agent_id: 'my-agent-v1' }, schema: { properties: { agent_id: { type: 'string' } }, required: ['agent_id'] } },
          output: { example: { success: true, agent_id: 'my-agent-v1', score: 50.0, grade: 'D' } }
        }}},
        mimeType: 'application/json'
      },
      'POST /x402/rep/register': {
        accepts: [{ scheme: 'exact', price: '$0.01', network: X402_NETWORK, payTo: PAY_TO }],
        description: 'Register an AI agent and create a reputation profile',
        extensions: { bazaar: { info: {
          input: { type: 'http', method: 'POST', bodyType: 'json',
            body: { agent_id: 'my-agent-v1', wallet_address: '0x...', display_name: 'My Agent', description: 'A helpful AI agent' },
            schema: { properties: { agent_id: { type: 'string' }, wallet_address: { type: 'string' }, display_name: { type: 'string' }, description: { type: 'string' } }, required: ['agent_id'] }
          },
          output: { example: { success: true, agent_id: 'my-agent-v1', score: 50.0, grade: 'D', message: 'Agent registered with baseline score of 50.' } }
        }}},
        mimeType: 'application/json'
      },
      'GET /x402/rep/score': {
        accepts: [{ scheme: 'exact', price: '$0.001', network: X402_NETWORK, payTo: PAY_TO }],
        description: 'Query an AI agent reputation score',
        extensions: { bazaar: { info: {
          input: { type: 'http', method: 'GET',
            queryParams: { agent_id: 'my-agent-v1' },
            schema: { properties: { agent_id: { type: 'string' } }, required: ['agent_id'] }
          },
          output: { example: { success: true, agent_id: 'my-agent-v1', score: 72.5, grade: 'B', summary: { endorsements: 5, reports: 0, transactions: 12, age_days: 30 }, trustworthy: true } }
        }}},
        mimeType: 'application/json'
      },
      'POST /x402/rep/endorse': {
        accepts: [{ scheme: 'exact', price: '$0.005', network: X402_NETWORK, payTo: PAY_TO }],
        description: 'Endorse an AI agent to increase their reputation score',
        extensions: { bazaar: { info: {
          input: { type: 'http', method: 'POST', bodyType: 'json',
            body: { from_agent_id: 'endorser-agent', to_agent_id: 'target-agent', comment: 'Reliable and accurate' },
            schema: { properties: { from_agent_id: { type: 'string' }, to_agent_id: { type: 'string' }, comment: { type: 'string' } }, required: ['from_agent_id', 'to_agent_id'] }
          },
          output: { example: { success: true, to_agent_id: 'target-agent', new_score: 75.0, score_increase: 3.0 } }
        }}},
        mimeType: 'application/json'
      },
      'POST /x402/rep/report': {
        accepts: [{ scheme: 'exact', price: '$0.005', network: X402_NETWORK, payTo: PAY_TO }],
        description: 'Report an AI agent for bad behavior',
        extensions: { bazaar: { info: {
          input: { type: 'http', method: 'POST', bodyType: 'json',
            body: { from_agent_id: 'reporter-agent', to_agent_id: 'bad-agent', reason: 'Provided false information' },
            schema: { properties: { from_agent_id: { type: 'string' }, to_agent_id: { type: 'string' }, reason: { type: 'string' } }, required: ['from_agent_id', 'to_agent_id'] }
          },
          output: { example: { success: true, to_agent_id: 'bad-agent', new_score: 45.0, message: 'Report recorded.' } }
        }}},
        mimeType: 'application/json'
      },
      'GET /x402/rep/profile': {
        accepts: [{ scheme: 'exact', price: '$0.001', network: X402_NETWORK, payTo: PAY_TO }],
        description: 'Get full reputation profile for an AI agent including endorsement history',
        extensions: { bazaar: { info: {
          input: { type: 'http', method: 'GET',
            queryParams: { agent_id: 'my-agent-v1' },
            schema: { properties: { agent_id: { type: 'string' } }, required: ['agent_id'] }
          },
          output: { example: { success: true, agent_id: 'my-agent-v1', score: 72.5, grade: 'B', trustworthy: true, stats: { endorsements: 5, reports: 0, age_days: 30 }, recent_endorsements: [] } }
        }}},
        mimeType: 'application/json'
      }
    },
    x402Server,
    { afterSettle: (req, res, next, s) => { const e = s?.extensionResponses; if (e) { console.log('[CDP] EXTENSION-RESPONSES:', JSON.stringify(e)); } next(); } },
    null, true
  ));

  console.log('CDP auth configured for x402 mainnet');
  console.log('x402 middleware initialized:', X402_NETWORK);
} catch (err) {
  console.error('x402 init failed:', err.message);
}

// Mount routes
app.use('/x402/rep/register', registerRouter);
app.use('/x402/rep/score', scoreRouter);
app.use('/x402/rep/endorse', endorseRouter);
app.use('/x402/rep/report', reportRouter);
app.use('/x402/rep/profile', profileRouter);

app.use((req, res) => res.status(404).json({ error: 'Not found', service: 'AgentRep' }));

app.listen(PORT, () => console.log(`AgentRep running on port ${PORT}`));
