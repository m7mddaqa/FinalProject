import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';

//import routers and middlewares
import requireAuth from './middlewares/requireAuth.js';
import signupRouter from './Routers/signupRouter.js';
import loginRouter from './Routers/loginRouter.js';
import searchHistoryRouter from './Routers/searchHistoryRouter.js';
import userRouter from './Routers/userRouter.js';
import eventsRouter from './Routers/eventsRouter.js';
import volunteersScoreboardRouter from './Routers/VolunteersScoreboardRouter.js';
import usersScoreboardRouter from './Routers/UsersScoreboardRouter.js';

import Event from './Schemas/Event.js';
import User from './Schemas/User.js';

dotenv.config();
const app = express();
const server = http.createServer(app);

//WebSocket setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT']
  }
});

io.on('connection', (socket) => {
  console.log('[SOCKET] Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('[SOCKET] Client disconnected:', socket.id);
  });
});

//add periodic check for expired events
setInterval(async () => {
  try {
    // Find unresolved events that are older than 1 hour
    const expiredEvents = await Event.find({
      createdAt: { $lt: new Date(Date.now() - 3600000) }, // 60 minutes ago
      resolved: false // Only unresolved events
    });
    
    if (expiredEvents.length > 0) {
      //remove expired unresolved events
      await Event.deleteMany({
        createdAt: { $lt: new Date(Date.now() - 3600000) },
        resolved: false
      });
      
      //notify all clients
      io.emit('updateReports');
    }
  } catch (error) {
    console.error('Error checking for expired events:', error);
  }
}, 60000); //check every minute

app.set('io', io);

//middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), 'uploads')));

//mongoDB
const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('[DB] MongoDB connected');

    // Remove TTL index if it exists
    const collection = mongoose.connection.db.collection('events');
    const indexes = await collection.indexes();
    const ttlIndex = indexes.find(i => i.name === 'createdAt_1');
    if (ttlIndex) {
      await collection.dropIndex('createdAt_1');
      console.log('[TTL] TTL index dropped');
    }
  })
  .catch(err => console.error('[DB] MongoDB connection error:', err));

//routes
app.use('/api', signupRouter);
app.use('/api', loginRouter);
app.use('/api', eventsRouter);
app.use('/api', searchHistoryRouter);
app.use('/api', userRouter);
app.use('/api', volunteersScoreboardRouter);
app.use('/api', usersScoreboardRouter);

// Add alerts endpoint
app.post('/api/alerts', (req, res) => {
    try {
        console.log('[API] Received alert request:', {
            body: req.body,
            headers: req.headers,
            method: req.method,
            path: req.path,
            ip: req.ip,
            ips: req.ips
        });

        const alert = req.body;
        if (!alert || !alert.city || !alert.lat || !alert.lon) {
            console.error('[API] Invalid alert data:', alert);
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid alert data. Required fields: city, lat, lon' 
            });
        }

        console.log('[API] Broadcasting alert:', alert);
        // Broadcast the alert to all connected clients
        io.emit('cityAlert', alert);
        console.log('[API] Alert broadcasted successfully');
        res.json({ success: true, message: 'Alert broadcasted' });
    } catch (error) {
        console.error('[API] Error handling alert:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add a test endpoint with more detailed response
app.get('/api/test', (req, res) => {
    console.log('[API] Test endpoint hit:', {
        ip: req.ip,
        ips: req.ips,
        headers: req.headers
    });
    res.json({ 
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        clientIp: req.ip
    });
});

//root
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Add a new endpoint for resolving events
app.post('/api/events/:eventId/resolve', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { volunteerLat, volunteerLon } = req.body;
    const userId = req.user._id;

    if (!eventId) {
      console.error('No eventId provided in request');
      return res.status(400).json({ message: 'Event ID is required' });
    }

    console.log('Resolve request:', {
      eventId,
      volunteerLat,
      volunteerLon,
      userId
    });

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      console.log('Event not found:', eventId);
      return res.status(404).json({ message: 'Event not found' });
    }

    // If event is already resolved, return error
    if (event.resolved) {
      console.log('Event already resolved:', eventId);
      return res.status(400).json({ message: 'This event has already been resolved' });
    }

    console.log('Found event:', {
      eventId: event._id,
      location: event.location,
      resolved: event.resolved,
      arrivedVolunteers: event.ArrivedVolunteers.users
    });

    // Calculate distance between volunteer and event
    const distance = calculateDistance(
      volunteerLat,
      volunteerLon,
      event.location.latitude,
      event.location.longitude
    );

    console.log('Distance calculation:', {
      distance,
      volunteerLocation: { lat: volunteerLat, lon: volunteerLon },
      eventLocation: event.location
    });

    // Check if volunteer is within 50 meters of the event
    if (distance > 0.05) { // 0.05 km = 50 meters
      return res.status(403).json({ 
        message: 'You must be within 50 meters of the event location to help resolve it',
        distance: distance
      });
    }

    // Get current user info
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    // Check if current user is in ArrivedVolunteers, if not add them
    if (!event.ArrivedVolunteers.users.includes(userId)) {
      event.ArrivedVolunteers.users.push(userId);
      event.ArrivedVolunteers.count += 1;
      await event.save();
      console.log('Added current user to ArrivedVolunteers:', userId);
    }

    // Find all volunteers within 50 meters of the event
    const nearbyVolunteers = await User.find({
      _id: { $in: event.ArrivedVolunteers.users },
      userType: 'volunteer'
    });

    if (nearbyVolunteers.length === 0) {
      return res.status(400).json({ message: 'No volunteers found at the location' });
    }

    console.log('Nearby volunteers:', nearbyVolunteers.map(v => v.username));

    // Update event status with all participating volunteers
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        $set: {
          resolved: true,
          resolvedBy: userId,
          resolvedAt: new Date(),
          participatingVolunteers: nearbyVolunteers.map(v => ({
            userId: v._id,
            username: v.username
          }))
        }
      },
      { new: true }
    );

    if (!updatedEvent) {
      throw new Error('Failed to update event');
    }

    // Update scores for all participating volunteers
    const updatePromises = nearbyVolunteers.map(volunteer =>
      User.findByIdAndUpdate(
        volunteer._id,
        { $inc: { score: 10 } },
        { new: true }
      )
    );

    const updatedVolunteers = await Promise.all(updatePromises);

    if (updatedVolunteers.length === 0) {
      throw new Error('Failed to update volunteer scores');
    }

    console.log('Update results:', {
      eventUpdated: !!updatedEvent,
      volunteersUpdated: updatedVolunteers.length,
      newScores: updatedVolunteers.map(v => ({
        username: v.username,
        score: v.score
      }))
    });

    // Emit specific event for resolution
    io.emit('eventResolved', {
      eventId: event._id,
      resolvedBy: userId,
      participatingVolunteers: updatedVolunteers.map(v => ({
        username: v.username,
        newScore: v.score
      }))
    });

    // Also emit general update
    io.emit('updateReports');

    res.json({ 
      success: true, 
      message: 'Event resolved successfully',
      participatingVolunteers: updatedVolunteers.map(v => ({
        username: v.username,
        newScore: v.score
      }))
    });
  } catch (error) {
    console.error('Error resolving event:', error);
    res.status(500).json({ 
      message: 'Error resolving event',
      error: error.message 
    });
  }
});

// Add endpoint for volunteer arrival
app.post('/api/events/:eventId/arrive', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    if (!eventId) {
      console.error('No eventId provided in request');
      return res.status(400).json({ message: 'Event ID is required' });
    }

    console.log('Volunteer arrival request:', {
      eventId,
      userId
    });

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      console.log('Event not found:', eventId);
      return res.status(404).json({ message: 'Event not found' });
    }

    // If event is already resolved, return error
    if (event.resolved) {
      console.log('Event already resolved:', eventId);
      return res.status(400).json({ message: 'This event has already been resolved' });
    }

    // Check if volunteer is already in ArrivedVolunteers
    if (!event.ArrivedVolunteers.users.includes(userId)) {
      event.ArrivedVolunteers.users.push(userId);
      event.ArrivedVolunteers.count += 1;
      await event.save();
      console.log('Added volunteer to ArrivedVolunteers:', userId);
    }

    // Notify all clients about the update
    io.emit('updateReports');

    res.json({ 
      success: true, 
      message: 'Volunteer marked as arrived',
      arrivedVolunteersCount: event.ArrivedVolunteers.count
    });
  } catch (error) {
    console.error('Error marking volunteer as arrived:', error);
    res.status(500).json({ 
      message: 'Error marking volunteer as arrived',
      error: error.message 
    });
  }
});

// Helper function to calculate distance between two points in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

// Add an endpoint to get resolved events history
app.get('/api/events/resolved', requireAuth, async (req, res) => {
  try {
    const resolvedEvents = await Event.find({ resolved: true })
      .sort({ resolvedAt: -1 })
      .populate('resolvedBy', 'username score');
    
    res.json(resolvedEvents);
  } catch (error) {
    console.error('Error fetching resolved events:', error);
    res.status(500).json({ message: 'Error fetching resolved events' });
  }
});

// Get resolved events
app.get('/api/events/resolved', async (req, res) => {
    try {
        const resolvedEvents = await Event.find({ resolved: true })
            .populate('userId', 'username')
            .populate('participatingVolunteers.userId', 'username')
            .sort({ resolvedAt: -1 });

        const formattedEvents = resolvedEvents.map(event => ({
            ...event.toObject(),
            userInfo: {
                username: event.userId?.username || 'Anonymous'
            },
            participatingVolunteers: event.participatingVolunteers.map(vol => ({
                userId: vol.userId._id,
                username: vol.userId.username
            }))
        }));

        res.json(formattedEvents);
    } catch (error) {
        console.error('Error fetching resolved events:', error);
        res.status(500).json({ message: 'Error fetching resolved events' });
    }
});

//start server
server.listen(3001, '0.0.0.0', () => {
  console.log('Server is running on http://192.168.1.233:3001');
});
