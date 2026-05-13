import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// Get user profile helper (can be used by the frontend to fetch additional metadata not in JWT)
router.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, avatar_url, is_verified, created_at')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'User not found' });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
