// backend/controllers/classSlotController.js


import ClassSlotService from '../services/classSlotService.js';

class ClassSlotController {
    async getAll(req, res, next) {
        try {
            res.json(await ClassSlotService.getAll(req.supabase));
        } catch (e) { next(e); }
    }
    async getByDayAndGroup(req, res, next) {
        try {
            const { dayOfWeek, groupType } = req.query;
            if (!dayOfWeek || !groupType) return res.status(400).json({ error: 'dayOfWeek and groupType are required' });
            res.json(await ClassSlotService.getByDayAndGroup(req.supabase, dayOfWeek, groupType));
        } catch (e) { next(e); }
    }
    async create(req, res, next) {
        try {
            res.status(201).json(await ClassSlotService.create(req.supabase, req.user.id, req.body));
        } catch (e) { next(e); }
    }
    async delete(req, res, next) {
        try {
            await ClassSlotService.delete(req.supabase, req.params.id);
            res.json({ message: 'Slot deleted' });
        } catch (e) { next(e); }
    }
}
export default new ClassSlotController();
