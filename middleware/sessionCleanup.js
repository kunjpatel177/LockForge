const Session = require("../models/Session");

module.exports = async (req, res, next) => {

    try {
        // if session expired OR not valid
        if (!req.session || !req.session.userId) {

            if (req.sessionID) {
                await Session.deleteOne({
                    sessionId: req.sessionID
                });
            }
        }

        next();
    } catch (err) {
        console.error("Session cleanup error:", err);
        next();
    }
};