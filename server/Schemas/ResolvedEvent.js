import mongoose from 'mongoose';

const ResolvedEventSchema = new mongoose.Schema({
    category: {
        type: String,
        enum: ['normal', 'emergency'],
        required: true
    },
    type: {
        type: String,
        required: true
    },
    points: {
        type: Number,
        default: 3
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
        default: true
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

const ResolvedEvent = mongoose.model('ResolvedEvent', ResolvedEventSchema);
export default ResolvedEvent;