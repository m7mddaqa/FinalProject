import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
    type: String,
    location: {
        latitude: Number,
        longitude: Number
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    verified: {
        type: String,
        enum: ['pending', 'yes', 'no'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600 //delete after 1 hour
    }
});

const Event = mongoose.model('Event', EventSchema);
export default Event;
