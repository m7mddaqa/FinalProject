import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
console.log('[DEBUG] Upload middleware initialized');
console.log('[DEBUG] Current working directory:', process.cwd());
console.log('[DEBUG] Uploads directory path:', uploadsDir);
console.log('[DEBUG] Uploads directory exists:', fs.existsSync(uploadsDir));
if (!fs.existsSync(uploadsDir)) {
    console.log('[DEBUG] Creating uploads directory');
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('[DEBUG] Saving file to:', uploadsDir);
        console.log('[DEBUG] Current working directory:', process.cwd());
        console.log('[DEBUG] Uploads directory exists:', fs.existsSync(uploadsDir));
        if (!fs.existsSync(uploadsDir)) {
            console.log('[DEBUG] Creating uploads directory');
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = uniqueSuffix + path.extname(file.originalname);
        const fullPath = path.join(uploadsDir, filename);
        console.log('[DEBUG] Generated filename:', filename);
        console.log('[DEBUG] Full file path:', fullPath);
        console.log('[DEBUG] File details:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            uploadsDir: uploadsDir,
            currentDir: process.cwd()
        });
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit for videos
    },
    fileFilter: function (req, file, cb) {
        console.log('[DEBUG] File being uploaded:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        });
        
        //check file size before accepting
        if (file.size > 50 * 1024 * 1024) {
            console.log('[ERROR] File too large:', file.size);
            return cb(new Error('File size must be less than 50MB'), false);
        }
        
        // Accept images and videos
        const allowedImageTypes = /\.(jpg|jpeg|png|gif)$/;
        const allowedVideoTypes = /\.(mp4|mov|avi|wmv|flv|mkv)$/;
        const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'video/mp4',
            'video/quicktime',
            'video/x-msvideo',
            'video/x-ms-wmv',
            'video/x-flv',
            'video/x-matroska'
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            console.log('[ERROR] Invalid file type:', file.mimetype);
            return cb(new Error('Only image and video files are allowed!'), false);
        }

        if (!file.originalname.match(allowedImageTypes) && !file.originalname.match(allowedVideoTypes)) {
            console.log('[ERROR] Invalid file extension:', file.originalname);
            return cb(new Error('Invalid file extension. Allowed: jpg, jpeg, png, gif, mp4, mov, avi, wmv, flv, mkv'), false);
        }

        cb(null, true);
    }
});

// Add error handling middleware
upload.errorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('[ERROR] Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size must be less than 50MB' });
        }
        return res.status(400).json({ error: err.message });
    } else if (err) {
        console.error('[ERROR] Upload error:', err);
        return res.status(500).json({ error: 'File upload failed' });
    }
    next();
};

// Add file validation middleware
upload.validateFile = (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const filePath = path.join(uploadsDir, req.file.filename);
    console.log('[DEBUG] Validating file:', filePath);
    
    fs.stat(filePath, (err, stats) => {
        if (err) {
            console.error('[ERROR] File validation error:', err);
            return res.status(500).json({ error: 'Failed to validate uploaded file' });
        }

        console.log('[DEBUG] File stats:', stats);
        
        if (stats.size === 0) {
            console.error('[ERROR] File is empty:', req.file.filename);
            // Delete the empty file
            fs.unlink(filePath, (err) => {
                if (err) console.error('[ERROR] Failed to delete empty file:', err);
            });
            return res.status(400).json({ error: 'Uploaded file is empty' });
        }

        console.log('[DEBUG] File validated:', {
            filename: req.file.filename,
            size: stats.size
        });
        next();
    });
};

export default upload; 