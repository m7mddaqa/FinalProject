import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    searchQuery: {
        type: String,
        required: true
    },
    location: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        }
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('SearchHistory', searchHistorySchema); 