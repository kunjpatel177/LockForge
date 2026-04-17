const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    sessionId: String,
    ip: String,
    device: String,
    lastActive: {
        type: Date,
        default: Date.now
    },
    location: String
});

module.exports = mongoose.model("Session", sessionSchema);