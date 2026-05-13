import express from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole, ROLES } from '../middleware/roleCheck.js';

const router = express.Router();

// Apply auth middleware to all donation routes
router.use(requireAuth);

// Get all donations for the logged-in donor
router.get('/my-donations', requireRole([ROLES.DONOR]), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('donor_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin ONLY: Get all donations
router.get('/', requireRole([ROLES.ADMIN]), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('donations')
      .select('*, users(full_name)') // join with donor name if possible
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// The frontend inserts directly to Supabase for Phase 1, but here is the API equivalent
const donationSchema = z.object({
  category: z.string(),
  items_json: z.array(z.any()),
  quantity: z.number()
});

router.post('/', requireRole([ROLES.DONOR]), async (req, res) => {
  try {
    const validatedData = donationSchema.parse(req.body);

    const { data, error } = await supabase
      .from('donations')
      .insert({
        donor_id: req.user.id,
        category: validatedData.category,
        items_json: validatedData.items_json,
        quantity: validatedData.quantity,
        status: 'submitted'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
