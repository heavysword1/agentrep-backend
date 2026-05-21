const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { from_agent_id, to_agent_id, reason } = req.body;
  if (!from_agent_id || !to_agent_id) return res.status(400).json({ error: 'from_agent_id and to_agent_id are required' });
  if (from_agent_id === to_agent_id) return res.status(400).json({ error: 'Cannot report yourself' });

  const { supabase } = req.app.locals;

  const { data: target } = await supabase.from('agents_rep').select('agent_id, score, reports').eq('agent_id', to_agent_id).single();
  if (!target) return res.status(404).json({ error: 'Target agent not found' });

  const score_delta = -5;
  const new_score = Math.max(0, target.score + score_delta);

  await supabase.from('rep_reports').insert([{ from_agent_id, to_agent_id, reason }]);
  await supabase.from('agents_rep')
    .update({ score: new_score, reports: target.reports + 1, updated_at: new Date().toISOString() })
    .eq('agent_id', to_agent_id);

  res.json({
    success: true,
    to_agent_id,
    new_score: Math.round(new_score * 10) / 10,
    message: 'Report recorded. Repeated reports will significantly lower the agent\'s reputation.'
  });
});

module.exports = router;

router.get('/', (req, res) => {
  res.status(400).json({ error: 'Use POST to report an agent. Required: from_agent_id, to_agent_id.' });
});
