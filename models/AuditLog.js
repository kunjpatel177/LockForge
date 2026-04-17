const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    action: String, // login, logout, add, delete, edit
    ip: String,
    userAgent: String,
    device: String,
    time: {
        type: Date,
        default: Date.now
    },
    location: String,
});

module.exports = mongoose.model("AuditLog", auditSchema);