const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const { agent_id } = req.query;
  if (!agent_id) return res.status(400).json({ error: 'agent_id is required' });

  const { supabase } = req.app.locals;
  const { data, error } = await supabase
    .from('agents_rep')
    .select('agent_id, score, endorsements, reports, tx_count, created_at')
    .eq('agent_id', agent_id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Agent not found. Register at POST /x402/rep/register' });

  const age_days = Math.floor((Date.now() - new Date(data.created_at)) / 86400000);
  res.json({
    success: true,
    agent_id: data.agent_id,
    score: Math.round(data.score * 10) / 10,
    grade: getGrade(data.score),
    summary: { endorsements: data.endorsements, reports: data.reports, transactions: data.tx_count, age_days },
    trustworthy: data.score >= 60 && data.reports === 0
  });
});

function getGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

module.exports = router;
