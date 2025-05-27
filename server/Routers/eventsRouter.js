import express from 'express';
const router = express.Router();
import path from 'path';
import { fileURLToPath } from 'url';

import Event from '../Schemas/Event.js';
import ResolvedEvent from '../Schemas/ResolvedEvent.js';
import User from '../Schemas/User.js';
import jwt from 'jsonwebtoken';
import upload from '../middlewares/uploadMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import haversine from 'haversine-distance';

//This is my helper function to calculate distance between two coordinates
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

router.post('/events', upload.single('image'), upload.validateFile, upload.errorHandler, async (req, res) => {
  console.log('[INFO] /api/events POST route hit');
  console.log('[DEBUG] Request body:', req.body);
  console.log('[DEBUG] Uploaded file:', req.file);

  if (req.fileValidationError) {
    console.error('[ERROR] File validation error:', req.fileValidationError);
    return res.status(400).json({ error: req.fileValidationError });
  }

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

  const { type, location, description, category } = req.body;
  if (!type || !location || !location.latitude || !location.longitude || !category) {
    console.warn('[WARN] Missing or invalid event data:', req.body);
    return res.status(400).json({ error: 'Invalid event data' });
  }

  try {
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    console.log('[DEBUG] Constructed image URL:', imageUrl);

    const user = await User.findById(userId);
    if (!user) {
      console.error('[ERROR] User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.blacklisted) {
      console.warn('[WARN] Blacklisted user attempted to create report:', userId);
      return res.status(403).json({ error: 'You are blacklisted and cannot create new reports.' });
    }

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
      userId: userId, // Explicitly set userId
      userInfo: {
        name: user.username,
        email: user.email,
      },
      verified: 'pending',
    });

    await event.save();
    console.log('[INFO] Event created successfully:', {
      eventId: event._id,
      userId: event.userId,
      category: event.category,
    });

    const io = req.app.get('io');
    io.emit('newEvent', event);
    io.emit('updateReports');

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
      console.warn('[WARN] No token provided');
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      console.error('[ERROR] Event not found:', id);
      return res.status(404).json({ error: 'Event not found' });
    }

    console.log('[DEBUG] Event data:', {
      eventId: id,
      userId: event.userId,
      category: event.category,
      resolved: event.resolved,
    });

    if (event.resolved) {
      console.warn('[WARN] Event already resolved:', id);
      return res.status(400).json({ message: 'This event has already been resolved' });
    }

    // Add resolving user to participatingVolunteers
    const volunteer = await User.findById(decoded.id);
    if (!volunteer) {
      console.error('[ERROR] Volunteer not found:', decoded.id);
      return res.status(404).json({ error: 'Volunteer not found' });
    }
    if (!event.participatingVolunteers.some(v => v.userId.toString() === decoded.id)) {
      event.participatingVolunteers.push({
        userId: decoded.id,
        username: volunteer.username
      });
    }

    // Create a new ResolvedEvent
    const resolvedEvent = new ResolvedEvent({
      category: event.category,
      type: event.type,
      points: event.points,
      location: event.location,
      userId: event.userId,
      userInfo: event.userInfo,
      description: event.description,
      image: event.image,
      resolved: true,
      verified: event.verified,
      OnWayVolunteers: event.OnWayVolunteers,
      ArrivedVolunteers: event.ArrivedVolunteers,
      participatingVolunteers: event.participatingVolunteers,
      resolvedBy: decoded.id,
      resolvedAt: new Date(),
      createdAt: event.createdAt
    });

    await resolvedEvent.save();
    console.log('[INFO] Event moved to resolvedevents:', id);

    // Delete the event from the events collection
    await Event.findByIdAndDelete(id);
    console.log('[INFO] Event deleted from events collection:', id);

    // Award 10 points to the volunteer
    volunteer.score = (volunteer.score || 0) + 10;
    await volunteer.save();
    console.log('[INFO] Awarded 10 points to volunteer:', {
      userId: decoded.id,
      username: volunteer.username,
      newScore: volunteer.score,
    });

    // Award 10 points to the reporter
    let reporter = null;
    if (!event.userId) {
      console.error('[ERROR] No userId associated with event:', id);
    } else {
      reporter = await User.findById(event.userId);
      if (reporter) {
        reporter.score = (reporter.score || 0) + 10;
        await reporter.save();
        console.log('[INFO] Awarded 10 points to reporter:', {
          userId: event.userId,
          username: reporter.username,
          newScore: reporter.score,
        });
      } else {
        console.error('[ERROR] Reporter not found for userId:', event.userId);
      }
    }

    // Notify all clients
    const io = req.app.get('io');
    io.emit('eventResolved', { eventId: id });
    io.emit('updateReports');

    res.json({
      message: 'Event marked as resolved and moved to resolvedevents. Points awarded.',
      participatingVolunteers: [{ username: volunteer.username || 'Unknown', newScore: volunteer.score }],
      reporter: reporter ? { username: reporter.username || 'Unknown', newScore: reporter.score } : null,
    });
  } catch (err) {
    console.error('[ERROR] Failed to resolve event:', err.message);
    res.status(500).json({ error: 'Failed to resolve event' });
  }
});

router.get('/events/:id/debug', async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      console.error('[ERROR] Event not found:', id);
      return res.status(404).json({ error: 'Event not found' });
    }

    let reporter = null;
    if (event.userId) {
      reporter = await User.findById(event.userId);
    }

    console.log('[DEBUG] Event debug info:', {
      eventId: id,
      userId: event.userId,
      category: event.category,
      resolved: event.resolved,
      reporterFound: !!reporter,
      reporterUsername: reporter ? reporter.username : 'N/A',
    });

    res.json({
      event: {
        _id: event._id,
        userId: event.userId,
        category: event.category,
        type: event.type,
        location: event.location,
        resolved: event.resolved,
      },
      reporter: reporter ? { _id: reporter._id, username: reporter.username, score: reporter.score } : null,
    });
  } catch (err) {
    console.error('[ERROR] Failed to fetch event debug info:', err.message);
    res.status(500).json({ error: 'Failed to fetch event debug info' });
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

// Get resolved events for a specific user
router.get('/events/resolved/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all resolved events where the user is a participating volunteer
    const resolvedEvents = await ResolvedEvent.find({
      'participatingVolunteers.userId': userId
    })
    .populate('userId', 'username')
    .populate('participatingVolunteers.userId', 'username')
    .sort({ resolvedAt: -1 });

    res.json(resolvedEvents);
  } catch (err) {
    console.error('[ERROR] Failed to fetch resolved events:', err.message);
    res.status(500).json({ error: 'Failed to fetch resolved events' });
  }
});
// Confirmation of presence for "normal" reports
router.put('/events/:id/confirmPresence', async (req, res) => {
  try {
    const { id } = req.params;
    const { present } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      console.error('[ERROR] Event not found:', id);
      return res.status(404).json({ error: 'Event not found' });
    }
    if (event.category !== 'normal') {
      console.warn('[WARN] Confirm presence only applicable to normal reports:', id);
      return res.status(400).json({ error: 'Only applicable to normal reports' });
    }
    if (event.resolved) {
      console.warn('[WARN] Cannot confirm presence for resolved event:', id);
      return res.status(400).json({ error: 'Cannot confirm presence for a resolved event' });
    }

    if (!present) {
      event.points = (event.points || 1) - 1; // Ensure points is initialized
      console.log('[INFO] Points decremented:', { eventId: id, newPoints: event.points });
      if (event.points <= 0) {
        await Event.findByIdAndDelete(id);
        console.log('[INFO] Event deleted due to zero points:', id);
        req.app.get('io').emit('eventDeleted', { eventId: id });
        req.app.get('io').emit('updateReports');
        return res.json({ message: 'Report deleted', deleted: true });
      }
    } else {
      event.points = (event.points || 1) + 1;
      event.createdAt = new Date(); // Reset TTL
      console.log('[INFO] Points incremented:', { eventId: id, newPoints: event.points });
    }

    await event.save();
    req.app.get('io').emit('updateReports');
    res.json({ message: 'Presence confirmed', points: event.points, deleted: false });
  } catch (err) {
    console.error('[ERROR] Error confirming presence:', err.message);
    res.status(500).json({ error: 'Error confirming presence' });
  }
});

// -----------THIS IS FOR EMERGENCY REPORTS ----------
// Mark emergency report as fake

router.put('/events/:id/markFake', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Missing token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Missing volunteer location' });
    }

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ error: 'Event does not exist' });
    if (event.category !== 'emergency') {
      return res.status(400).json({ error: 'Only for emergencies' });
    }

    // Validate volunteer is at the location
    const eventLat = event.location.latitude;
    const eventLon = event.location.longitude;
    const distance = getDistanceKm(eventLat, eventLon, latitude, longitude);

    if (distance > 0.1) {
      return res.status(403).json({ error: 'You are too far from the event location to mark it as fake.' });
    }

    // Add resolving user to participatingVolunteers
    const volunteer = await User.findById(decoded.id);
    if (!volunteer) {
      console.error('[ERROR] Volunteer not found:', decoded.id);
      return res.status(404).json({ error: 'Volunteer not found' });
    }
    if (!event.participatingVolunteers.some(v => v.userId.toString() === decoded.id)) {
      event.participatingVolunteers.push({
        userId: decoded.id,
        username: volunteer.username
      });
    }

    // Create a new ResolvedEvent
    const resolvedEvent = new ResolvedEvent({
      category: event.category,
      type: event.type,
      points: event.points,
      location: event.location,
      userId: event.userId,
      userInfo: event.userInfo,
      description: event.description,
      image: event.image,
      resolved: true,
      verified: event.verified,
      OnWayVolunteers: event.OnWayVolunteers,
      ArrivedVolunteers: event.ArrivedVolunteers,
      participatingVolunteers: event.participatingVolunteers,
      resolvedBy: decoded.id,
      resolvedAt: new Date(),
      createdAt: event.createdAt
    });

    await resolvedEvent.save();
    console.log('[INFO] Event moved to resolvedevents as fake:', id);

    // Delete the event from the events collection
    await Event.findByIdAndDelete(id);
    console.log('[INFO] Event deleted from events collection:', id);

    // Subtract 10 points from reporter
    const reporter = await User.findById(event.userId);
    if (reporter) {
      reporter.score = Math.max(0, reporter.score - 10);
      if (reporter.score === 0) {
        reporter.blacklisted = true;
      }
      await reporter.save();
    }

    // Notify via socket
    req.app.get('io')?.emit('updateReports');

    res.json({
      message: 'Event marked as fake and moved to resolvedevents',
      reporterScore: reporter?.score
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error marking as fake' });
  }
});

router.get('/events/reported/resolved/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all resolved events reported by the user
    const resolvedReportedEvents = await ResolvedEvent.find({
      userId: userId
    })
    .populate('userId', 'username')
    .populate('participatingVolunteers.userId', 'username')
    .sort({ resolvedAt: -1 });

    res.json(resolvedReportedEvents);
  } catch (err) {
    console.error('[ERROR] Failed to fetch resolved reported events:', err.message);
    res.status(500).json({ error: 'Failed to fetch resolved reported events' });
  }
});

export default router;