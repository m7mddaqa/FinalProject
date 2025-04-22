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
    const io = req.app.get('io');
    //emit to all connected clients
    io.emit('newEvent', event);
    io.emit('updateReports');
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
    const { latitude, longitude } = req.query;
    
    if (!latitude || !longitude) {
      const events = await Event.find({ resolved: { $ne: true } }).sort({ createdAt: -1 });
      return res.json(events);
    }

    // Convert coordinates to numbers
    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);

    // Get all unresolved events
    const events = await Event.find({ resolved: { $ne: true } });

    // Calculate distance for each event and add it to the event object
    const eventsWithDistance = events.map(event => {
      const eventLat = event.location.latitude;
      const eventLng = event.location.longitude;
      
      // Calculate distance using Haversine formula
      const R = 6371; // Earth's radius in kilometers
      const dLat = (eventLat - userLat) * Math.PI / 180;
      const dLng = (eventLng - userLng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(userLat * Math.PI / 180) * Math.cos(eventLat * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      return {
        ...event.toObject(),
        distance
      };
    });

    // Sort events by distance
    eventsWithDistance.sort((a, b) => a.distance - b.distance);

    res.json(eventsWithDistance);
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
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    //temporarily, change later
    event.resolved = true;
    await event.save();
    const io = req.app.get('io');
    io.emit('updateReports'); //notify all frontend clients via sockets

    res.json({ message: 'Event marked as resolved' });
  } catch (err) {
    console.error('[ERROR] Failed to resolve event:', err.message);
    res.status(500).json({ error: 'Failed to resolve event' });
  }
});

export default router;
