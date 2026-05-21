const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { agent_id, wallet_address, display_name, description } = req.body;
  if (!agent_id) return res.status(400).json({ error: 'agent_id is required' });

  const { supabase } = req.app.locals;

  // Check if already registered
  const { data: existing } = await supabase
    .from('agents_rep')
    .select('agent_id, score')
    .eq('agent_id', agent_id)
    .single();

  if (existing) {
    return res.status(409).json({ error: 'Agent already registered', score: existing.score });
  }

  const { data, error } = await supabase
    .from('agents_rep')
    .insert([{ agent_id, wallet_address, display_name, description, score: 50.0 }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Registration failed', details: error.message });

  res.json({
    success: true,
    agent_id: data.agent_id,
    score: 50.0,
    grade: 'D',
    message: 'Agent registered with baseline score of 50. Earn endorsements to increase your reputation.'
  });
});

module.exports = router;

// GET variant for Bazaar indexing
router.get('/', (req, res) => {
  res.status(400).json({ error: 'Use POST to register an agent. Required: agent_id in request body.' });
});
