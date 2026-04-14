const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    masterPassword: {
        type: String,
        require: true
    },
    salt: {
        type: String,
        required: true
    }
}, { timestamps: true })

module.exports = mongoose.model("User", userSchema)