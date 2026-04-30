const mongoose = require("mongoose");
const startSessionCleaner = require("../utils/sessionCleaner");

module.exports = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("DB connected");

        startSessionCleaner();
    } catch (err) {
        console.log(err);
    }
};