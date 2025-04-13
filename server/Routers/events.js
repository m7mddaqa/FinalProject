import express from 'express';
import Event from '../Schemas/Event.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/', async (req, res) => {
  console.log('[INFO] /api/events POST route hit');

  // 1. Check token
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.warn('[WARN] No token provided');
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.id;
    console.log('[INFO] Token decoded. User ID:', userId);
  } catch (err) {
    console.error('[ERROR] Invalid token:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  // 2. Validate request body
  const { type, location } = req.body;
  if (!type || !location || !location.latitude || !location.longitude) {
    console.warn('[WARN] Missing or invalid event data:', req.body);
    return res.status(400).json({ error: 'Invalid event data' });
  }

  // 3. Try to save to MongoDB
  try {
    const event = new Event({
      type,
      location,
      userId
    });

    await event.save();
    console.log('[SUCCESS] Event saved to DB:', { type, location });
    res.status(201).json(event);
  } catch (err) {
    console.error('[ERROR] Failed to save event:', err.message);
    res.status(500).json({ error: 'Database error while saving event' });
  }
});




router.get('/', async (req, res) => {
    try {
      const events = await Event.find().sort({ createdAt: -1 }); // latest first
      res.json(events);
    } catch (err) {
      console.error('[ERROR] Failed to fetch events:', err.message);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });
export default router;
