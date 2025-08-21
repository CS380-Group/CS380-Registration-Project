
// backend/routes/classSlotRoutes.js


import express from 'express';
import ClassSlotController from '../controllers/classSlotController.js';
import { authenticate } from '../middleware/auth.js';
//import { makeSupabaseClient } from '../config/supabase.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

const attachSupabase = (req, _res, next) => {
    req.supabase = supabaseAdmin; // admin client for public read
    next();
};

// PUBLIC
router.get('/slots', attachSupabase, ClassSlotController.getAll);
router.get('/slots/search', attachSupabase, ClassSlotController.getByDayAndGroup);

// PROTECTED
router.post('/slots', authenticate, ClassSlotController.create);
router.delete('/slots/:id', authenticate, ClassSlotController.delete);

// TEMP: debug endpoint to verify what Supabase returns (remove after testing)
router.get('/slots/_debug', attachSupabase, async (req, res, next) => {
    try {
        const { data, error, count } = await req.supabase
            .from('class_slots')
            .select('*', { count: 'exact' })
            .limit(2);
        if (error) return next(error);
        res.json({ count, sample: data });
    } catch (e) { next(e); }
});


export default router;
