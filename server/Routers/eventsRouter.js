import express from 'express';
const router = express.Router();
import path from 'path';
import { fileURLToPath } from 'url';

import Event from '../Schemas/Event.js';
import User from '../Schemas/User.js';
import jwt from 'jsonwebtoken';
import upload from '../middlewares/uploadMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.post('/events', upload.single('image'), upload.validateFile, upload.errorHandler, async (req, res) => {
  console.log('[INFO] /api/events POST route hit');
  console.log('[DEBUG] Request body:', req.body);
  console.log('[DEBUG] Uploaded file:', req.file);

  // Check if file upload failed
  if (req.fileValidationError) {
    console.error('[ERROR] File validation error:', req.fileValidationError);
    return res.status(400).json({ error: req.fileValidationError });
  }

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
  const { type, location, description,category } = req.body;
  if (!type || !location || !location.latitude || !location.longitude || !category) {
    console.warn('[WARN] Missing or invalid event data:', req.body);
    return res.status(400).json({ error: 'Invalid event data' });
  }

  // 3. Try to save to MongoDB
  try {
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    console.log('[DEBUG] Constructed image URL:', imageUrl);

    // Get user information
    const user = await User.findById(userId);
    if (!user) {
      console.error('[ERROR] User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate user information
    if (!user.username || !user.email) {
      console.error('[ERROR] User missing required information:', { username: user.username, email: user.email });
      return res.status(400).json({ error: 'User profile incomplete. Please update your profile.' });
    }

    const event = new Event({
      category,
      type,
      location,
      description: description || '',
      image: imageUrl,
      userId,
      userInfo: {
        name: user.username,
        email: user.email
      },
      verified: 'pending'
    });

    await event.save();
    const io = req.app.get('io');
    //emit to all connected clients
    io.emit('newEvent', event);
    io.emit('updateReports');
    console.log('[INFO] Event saved successfully:', event);
    res.status(201).json(event);
  } catch (err) {
    console.error('[ERROR] Failed to save event:', err.message);
    console.error('[ERROR] Full error:', err);
    res.status(500).json({ error: 'Database error while saving event' });
  }
});

//fetch events
router.get('/events', async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      const events = await Event.find({ resolved: { $ne: true } })
        .sort({ createdAt: -1 });
      return res.json(events);
    }

    //convert coordinates to numbers
    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);

    //get all unresolved events
    const events = await Event.find({ resolved: { $ne: true } });

    //calculate distance for each event and add it to the event object
    const eventsWithDistance = events.map(event => {
      const eventLat = event.location.latitude;
      const eventLng = event.location.longitude;

      //calculate distance using Haversine formula
      const R = 6371; //earth's radius in kilometers
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

    //sort events by distance
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

//check if event still exists/active
router.get('/events/:id/findIfEventActive', async (req, res) => {
  const { id } = req.params;
  const event = await Event.findById(id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json(event);
}
);

router.put('/events/:id/incrementOnWayVolunteers', async (req, res) => {
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

    //check if the user is already in the list of on-way volunteers
    if (event.OnWayVolunteers.users.includes(decoded.id)) {
      return res.status(400).json({ error: 'User already on the way' });
    }
    //increment the number of volunteers on the way
    event.OnWayVolunteers.count++;
    //add the volunteer to the list of users on the way
    event.OnWayVolunteers.users.push(decoded.id);
    await event.save();
    const io = req.app.get('io');
    io.emit('updateReports'); //notify all frontend clients via sockets

    res.json({ message: 'Incremented the volunteers on the way to the event' });
  } catch (err) {
    console.error('[ERROR] Failed to increment on going volunteers:', err.message);
    res.status(500).json({ error: 'Failed to increment on going volunteers' });
  }
}
);


router.put('/events/:id/decrementOnWayVolunteers', async (req, res) => {
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

    //check if the user is in the list of on-way volunteers
    if (!event.OnWayVolunteers.users.includes(decoded.id)) {
      return res.status(400).json({ error: 'User not on the way' });
    }
    //decrement the number of volunteers on the way
    event.OnWayVolunteers.count--;
    //remove the volunteer from the list of users on the way
    event.OnWayVolunteers.users = event.OnWayVolunteers.users.filter(user => user.toString() !== decoded.id);
    await event.save();
    const io = req.app.get('io');
    io.emit('updateReports'); //notify all frontend clients via sockets

    res.json({ message: 'Decremented the volunteers on the way to the event' });
  } catch (err) {
    console.error('[ERROR] Failed to decrement on going volunteers:', err.message);
    res.status(500).json({ error: 'Failed to decrement on going volunteers' });
  }
}
);

router.put('/events/:id/incrementArrivedVolunteers', async (req, res) => {
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

    //check if the user is already in the list of on-way volunteers
    if (event.ArrivedVolunteers.users.includes(decoded.id)) {
      return res.status(400).json({ error: 'User has already arrived' });
    }
    //increment the number of volunteers on the way
    event.ArrivedVolunteers.count++;
    //add the volunteer to the list of users on the way
    event.ArrivedVolunteers.users.push(decoded.id);
    await event.save();
    const io = req.app.get('io');
    io.emit('updateReports'); //notify all frontend clients via sockets

    res.json({ message: 'Incremented the numbers of arrived volunteers to the event' });
  } catch (err) {
    console.error('[ERROR] Failed to increment the arrived volunteers:', err.message);
    res.status(500).json({ error: 'Failed to increment the arrived volunteers' });
  }
}
);



export default router;