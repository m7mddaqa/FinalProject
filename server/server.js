import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import eventsRouter from './Routers/eventsRouter.js';
import loginRouter from './Routers/loginRouter.js';
import signupRouter from './Routers/signupRouter.js';
import http from 'http';
import { Server } from 'socket.io';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
});

//middleware
app.use(cors());
app.use(express.json());

//serve static files from the uploads directory
const uploadsPath = path.join(process.cwd(), 'uploads');
console.log('[DEBUG] Server started in directory:', process.cwd());
console.log('[DEBUG] Static files will be served from:', uploadsPath);
console.log('[DEBUG] Uploads directory exists:', fs.existsSync(uploadsPath));
if (fs.existsSync(uploadsPath)) {
    console.log('[DEBUG] Uploads directory contents:', fs.readdirSync(uploadsPath));
}

//ensure uploads directory exists
if (!fs.existsSync(uploadsPath)) {
    console.log('[DEBUG] Creating uploads directory');
    fs.mkdirSync(uploadsPath, { recursive: true });
}

//serve static files with proper MIME types and detailed logging
app.use(['/uploads', '/api/uploads'], (req, res, next) => {
    try {
        console.log('[DEBUG] Request URL:', req.url);
        console.log('[DEBUG] Request path:', req.path);
        console.log('[DEBUG] Current working directory:', process.cwd());

        //remove any leading slashes and decode the URL
        const fileName = decodeURIComponent(req.path.replace(/^\/+/, ''));
        const filePath = path.join(uploadsPath, fileName);

        console.log('[DEBUG] Static file request:', {
            requestUrl: req.url,
            requestPath: req.path,
            decodedFileName: fileName,
            fullFilePath: filePath,
            fileExists: fs.existsSync(filePath),
            uploadsPath: uploadsPath,
            allFiles: fs.readdirSync(uploadsPath),
            currentDir: process.cwd()
        });

        if (!fs.existsSync(filePath)) {
            console.log('[ERROR] File not found:', {
                filePath,
                fileName,
                availableFiles: fs.readdirSync(uploadsPath),
                currentDir: process.cwd(),
                uploadsPath: uploadsPath
            });
            return res.status(404).json({ error: 'File not found', path: filePath });
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.mp4': 'video/mp4',
            '.mov': 'video/quicktime',
            '.avi': 'video/x-msvideo',
            '.webm': 'video/webm'
        }[ext] || 'application/octet-stream';

        //set appropriate headers for video streaming
        if (contentType.startsWith('video/')) {
            const stat = fs.statSync(filePath);
            const fileSize = stat.size;
            const range = req.headers.range;

            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = (end - start) + 1;
                const file = fs.createReadStream(filePath, { start, end });
                const head = {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=31536000'
                };
                res.writeHead(206, head);
                file.pipe(res);
            } else {
                const head = {
                    'Content-Length': fileSize,
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=31536000'
                };
                res.writeHead(200, head);
                fs.createReadStream(filePath).pipe(res);
            }
        } else {
            //for non-video files, set basic headers and stream
            res.setHeader('Content-Type', contentType);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=31536000');
            fs.createReadStream(filePath).pipe(res);
        }

        //handle stream errors
        res.on('error', (error) => {
            console.error('[ERROR] Response error:', error);
        });
    } catch (error) {
        console.error('[ERROR] Error serving file:', error);
        res.status(500).json({ error: 'Error serving file', details: error.message });
    }
});

//log all requests for debugging
app.use((req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.url}`);
    next();
});

//routes
app.use('/api', eventsRouter);
app.use('/api', loginRouter);
app.use('/api', signupRouter);

// Add new endpoint for telegram alerts
app.post('/api/alerts', express.json(), (req, res) => {
    try {
        console.log('[API] Received alert request:', {
            body: req.body,
            headers: req.headers,
            method: req.method,
            path: req.path
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
        res.json({ success: true, message: 'Alert broadcasted' });
    } catch (error) {
        console.error('[API] Error handling alert:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add a test endpoint to verify the server is working
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Add error handling for the server
server.on('error', (error) => {
    console.error('[SERVER] Error:', error);
});

// Add connection error handling
io.engine.on('connection_error', (err) => {
    console.error('[SOCKET] Connection error:', err);
});

//socket.io connection
io.on('connection', (socket) => {
    console.log('[SOCKET] A user connected:', socket.id);

    socket.on('error', (error) => {
        console.error('[SOCKET] Socket error:', error);
    });

    socket.on('disconnect', (reason) => {
        console.log('[SOCKET] User disconnected:', socket.id, 'Reason:', reason);
    });

    // Add a test event to verify socket connection
    socket.emit('test', { message: 'Socket connection established' });

    // Handle city alerts
    socket.on('cityAlert', (alert) => {
        console.log('[SOCKET] Received city alert:', alert);
        // Broadcast the alert to all connected clients
        io.emit('cityAlert', alert);
    });
});

//make io accessible to routes
app.set('io', io);

// Export io instance for use in other files
export { io };

//connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

//start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 