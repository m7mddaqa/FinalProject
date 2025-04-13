import express from 'express';
import SearchHistory from '../Schemas/SearchHistory.js';
import authenticateToken from '../middlewares/requireAuth.js';

const router = express.Router();

// Save a new search
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { searchQuery, location } = req.body;
        
        // Check if this search already exists for the user
        const existingSearch = await SearchHistory.findOne({
            userId: req.user._id,
            searchQuery: searchQuery
        });

        if (existingSearch) {
            // Update the timestamp of the existing search
            existingSearch.timestamp = new Date();
            await existingSearch.save();
            return res.status(200).json(existingSearch);
        }

        // If it's a new search, create a new entry
        const searchHistory = new SearchHistory({
            userId: req.user._id,
            searchQuery,
            location
        });
        await searchHistory.save();
        res.status(201).json(searchHistory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user's search history
router.get('/', authenticateToken, async (req, res) => {
    try {
        const searchHistory = await SearchHistory.find({ userId: req.user._id })
            .sort({ timestamp: -1 })
            .limit(10);
        res.json(searchHistory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router; 