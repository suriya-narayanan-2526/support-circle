import express from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole, ROLES } from '../middleware/roleCheck.js';
import { calculatePriorityScore } from '../services/priorityScorer.js';

const router = express.Router();

router.use(requireAuth);

const requestSchema = z.object({
  category: z.string(),
  description: z.string().optional()
});

// Orphanage POST: Submit a new request
router.post('/', requireRole([ROLES.ORPHANAGE]), async (req, res) => {
  try {
    const validated = requestSchema.parse(req.body);

    // Get the orphanage ID for this user
    const { data: orphanageParams } = await supabase
      .from('orphanages')
      .select('id, is_verified')
      .eq('user_id', req.user.id)
      .single();

    if (!orphanageParams) {
      return res.status(403).json({ success: false, error: 'User does not have an active orphanage profile' });
    }

    // AI SCORING (Using baseline internal numbers to keep the scorer functioning without UI inputs)
    const aiScore = calculatePriorityScore({
      urgency: 3,
      beneficiaries: 20,
      currentStock: 0
    });

    // Insert into DB
    const { data, error } = await supabase
      .from('orphan_requests')
      .insert({
        orphanage_id: orphanageParams.id,
        category: validated.category,
        urgency: 3,
        description: validated.description,
        ai_priority_score: aiScore,
        status: 'submitted'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data, ai_score: aiScore });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin GET: Review requests globally, smartly sorted by AI score
router.get('/admin', requireRole([ROLES.ADMIN]), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orphan_requests')
      .select('*, orphanages(organization_name, city, is_verified)')
      .order('ai_priority_score', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
