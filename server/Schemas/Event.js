import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
    category: {
        type: String,
        enum: ['normal', 'emergency'],
        required: true
    },
    type: {
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
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userInfo: {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        }
    },
    description: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: null
    },
    resolved: {
        type: Boolean,
        default: false
    },
    verified: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    OnWayVolunteers: {
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        count: { type: Number, default: 0 }
    },
    ArrivedVolunteers: {
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        count: { type: Number, default: 0 }
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 //delete after 5mins
    }
}, {
    timestamps: true
});

const Event = mongoose.model('Event', EventSchema);
export default Event;
