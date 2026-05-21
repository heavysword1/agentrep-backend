const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { from_agent_id, to_agent_id, comment } = req.body;
  if (!from_agent_id || !to_agent_id) return res.status(400).json({ error: 'from_agent_id and to_agent_id are required' });
  if (from_agent_id === to_agent_id) return res.status(400).json({ error: 'Cannot endorse yourself' });

  const { supabase } = req.app.locals;

  // Get endorser's score (higher score = more weight)
  const { data: endorser } = await supabase.from('agents_rep').select('score').eq('agent_id', from_agent_id).single();
  const { data: target } = await supabase.from('agents_rep').select('agent_id, score, endorsements').eq('agent_id', to_agent_id).single();

  if (!target) return res.status(404).json({ error: 'Target agent not found. They must register first.' });

  // Weight based on endorser score (0.5x to 2x)
  const weight = endorser ? Math.max(0.5, Math.min(2.0, endorser.score / 50)) : 1.0;
  const score_delta = 3 * weight;
  const new_score = Math.min(100, target.score + score_delta);

  // Record endorsement
  await supabase.from('rep_endorsements').insert([{ from_agent_id, to_agent_id, comment, weight }]);

  // Update target score
  await supabase.from('agents_rep')
    .update({ score: new_score, endorsements: target.endorsements + 1, updated_at: new Date().toISOString() })
    .eq('agent_id', to_agent_id);

  res.json({
    success: true,
    to_agent_id,
    new_score: Math.round(new_score * 10) / 10,
    score_increase: Math.round(score_delta * 10) / 10,
    endorser_weight: Math.round(weight * 100) / 100
  });
});

module.exports = router;

router.get('/', (req, res) => {
  res.status(400).json({ error: 'Use POST to endorse an agent. Required: from_agent_id, to_agent_id.' });
});
