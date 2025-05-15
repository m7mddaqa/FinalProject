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
    participatingVolunteers: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        username: {
            type: String,
            required: true
        }
    }],
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create a compound index for TTL only on unresolved events
EventSchema.index({ createdAt: 1, resolved: 1 }, { 
    expireAfterSeconds: 3600,
    partialFilterExpression: { resolved: false }
});

const Event = mongoose.model('Event', EventSchema);
export default Event;
