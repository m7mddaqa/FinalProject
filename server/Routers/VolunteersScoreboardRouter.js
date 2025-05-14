import express from 'express';
import User from '../Schemas/User.js';
const router = express.Router();


//route to get the list of volunteers with their points from DB
router.get('/volunteerScoreboard', async (req, res) => {
    try {
        const volunteers = await User.find({ userType: 'volunteer' })
            .select('username score')
            .sort({ score: -1 }); // Sort by score in descending order (-1)
        console.log('Volunteers List:', volunteers);
        res.status(200).json(volunteers);
    } catch (error) {
        console.error('Error fetching volunteers from database:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;