const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const fieldSchema = new Schema({
    label: {
        type: String,
        required: true
    },
    value: {
        type: Object, // encrypted data stored here
        required: true
    },
    type: {
        type: String,
        enum: ["text", "password", "otp"],
        default: "text"
        // default: "password"
    }
});

const credentialSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    service: {
        type: String,
        required: true
    },
    fields: [fieldSchema]
}, { timestamps: true });

module.exports = mongoose.model("Credential", credentialSchema);