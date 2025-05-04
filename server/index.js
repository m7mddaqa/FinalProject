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

import Event from './Schemas/Event.js';

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
    const expiredEvents = await Event.find({
      createdAt: { $lt: new Date(Date.now() - 300000) } // 5 minutes ago
    });
    
    if (expiredEvents.length > 0) {
      //remove expired events
      await Event.deleteMany({
        createdAt: { $lt: new Date(Date.now() - 300000) }
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


    const collection = mongoose.connection.db.collection('events');
    const indexes = await collection.indexes();
    const ttlIndex = indexes.find(i => i.name === 'createdAt_1');
    if (ttlIndex) {
      await collection.dropIndex('createdAt_1');
      console.log('[TTL] Old TTL index dropped');
    }
    await collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 300 });
    console.log('[TTL] Correct TTL index created');
  })
  .catch(err => console.error('[DB] MongoDB connection error:', err));

//routes
app.use('/api', signupRouter);
app.use('/api', loginRouter);
app.use('/api', eventsRouter);
app.use('/api', searchHistoryRouter);
app.use('/api', userRouter);

//root
app.get('/', (req, res) => {
  res.send('Hello World!');
});

//start server
server.listen(3001, '0.0.0.0', () => {
  console.log('Server is running on http://10.0.0.16:3001');
});
