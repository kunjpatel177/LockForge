// middleware/updateSession.js
const Session = require("../models/Session");

module.exports = async (req, res, next) => {
    if (req.session.userId) {
        await Session.findOneAndUpdate(
            { sessionId: req.sessionID },
            { lastActive: new Date() }
        );
    }
    next();
};