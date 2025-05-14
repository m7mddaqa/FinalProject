import express from 'express';
import User from '../Schemas/User.js';
const router = express.Router();

//route to get the list of all users with their scores from DB
router.get('/usersScoreboard', async (req, res) => {
    try {
        const users = await User.find({ userType: 'user' })
            .select('username score userType')
            .sort({ score: -1 }); // Sort by score in descending order (-1)
        console.log('Users List:', users);
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users from database:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router; 