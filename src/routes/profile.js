const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const { agent_id } = req.query;
  if (!agent_id) return res.status(400).json({ error: 'agent_id is required' });

  const { supabase } = req.app.locals;
  const [agentRes, endorsementsRes, reportsRes] = await Promise.all([
    supabase.from('agents_rep').select('*').eq('agent_id', agent_id).single(),
    supabase.from('rep_endorsements').select('from_agent_id, comment, weight, created_at').eq('to_agent_id', agent_id).order('created_at', { ascending: false }).limit(10),
    supabase.from('rep_reports').select('reason, created_at').eq('to_agent_id', agent_id).order('created_at', { ascending: false }).limit(5)
  ]);

  if (!agentRes.data) return res.status(404).json({ error: 'Agent not found' });

  const d = agentRes.data;
  const age_days = Math.floor((Date.now() - new Date(d.created_at)) / 86400000);

  res.json({
    success: true,
    agent_id: d.agent_id,
    display_name: d.display_name,
    description: d.description,
    wallet_address: d.wallet_address,
    score: Math.round(d.score * 10) / 10,
    grade: getGrade(d.score),
    trustworthy: d.score >= 60 && d.reports === 0,
    stats: { endorsements: d.endorsements, reports: d.reports, transactions: d.tx_count, age_days },
    recent_endorsements: endorsementsRes.data || [],
    recent_reports: reportsRes.data || [],
    registered_at: d.created_at
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
