import express from 'express';
import multer from 'multer';
import path from 'path';
import User from '../Schemas/User.js';
import requireAuth from '../middlewares/requireAuth.js';

const router = express.Router();

//multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

//get the user profile
router.get('/profile/:userId', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            _id: user._id,
            username: user.username,
            score: user.score,
            createdAt: user.createdAt,
            profileImage: user.profileImage
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: error.message });
    }
});

//update PFP
router.post('/profile/image', requireAuth, upload.single('image'), async (req, res) => {
    try {
        const userId = req.body.userId;
        const imagePath = req.file ? req.file.path : null;
        
        const user = await User.findByIdAndUpdate(
            userId,
            { profileImage: imagePath },
            { new: true }
        );
        
        res.json({ profileImage: user.profileImage });
    } catch (error) {
        console.error('Error updating profile image:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;