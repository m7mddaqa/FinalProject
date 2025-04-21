import express from 'express';
const router = express.Router();


import Event from '../Schemas/Event.js';
import jwt from 'jsonwebtoken';


router.post('/events', async (req, res) => {
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


//fetch events
router.get('/events', async (req, res) => {
    try {
      const events = await Event.find().sort({ createdAt: -1 }); //latest event shows up first
      res.json(events);
    } catch (err) {
      console.error('[ERROR] Failed to fetch events:', err.message);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  router.put('/events/:id/resolve', async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'Missing authorization token' });
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
  
      const { id } = req.params;
      const event = await Event.findById(id);
  
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
  
      //temporarily, change later
      event.resolved = true;
      await event.save();
  
      res.json({ message: 'Event marked as resolved' });
    } catch (err) {
      console.error('[ERROR] Failed to resolve event:', err.message);
      res.status(500).json({ error: 'Failed to resolve event' });
    }
  });
  
export default router;
