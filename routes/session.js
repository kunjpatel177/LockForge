const express = require("express");
const router = express.Router();
const isAuth = require("../middleware/auth")
const Session = require("../models/Session")
const AuditLog = require("../models/AuditLog");
const { getDevice } = require("../utils/device");
const { getLocation, getRealIP } = require("../utils/location");
const MongoStore = require("connect-mongo").default;

const store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI
});

router.post("/sessions/logout", isAuth, async (req, res) => {

    try {

        const { sessionId } = req.body;

        if (!sessionId) {
            return res.redirect("/sessions");
        }

        // Prevent logging out current session from this button
        if (sessionId === req.sessionID) {
            return res.redirect("/sessions");
        }

        // Remove from session store
        store.destroy(sessionId, async (err) => {

            if (err) {
                console.error("Session destroy error:", err);
                return res.redirect("/sessions");
            }

            // Remove from custom Session collection
            await Session.deleteOne({
                sessionId,
                userId: req.session.userId
            });

            await AuditLog.create({
                userId: req.session.userId,
                action: "logout",
                ip: getRealIP(req),
                userAgent: req.headers["user-agent"],
                device: getDevice(req),
                location: await getLocation(req)
            });

            req.flash("success", "Device logged out successfully");

            res.redirect("/sessions");
        });

    } catch (err) {
        console.error(err);
        req.flash("error", "Failed to logout device");
        res.redirect("/sessions");
    }
});

router.post("/sessions/logout-all", isAuth, async (req, res) => {

    try {

        const currentSessionId = req.sessionID;

        // Find all sessions except current
        const sessions = await Session.find({
            userId: req.session.userId,
            sessionId: { $ne: currentSessionId }
        });

        // Destroy each session from express-session store
        for (const session of sessions) {

            await new Promise((resolve) => {

                store.destroy(session.sessionId, (err) => {

                    if (err) {
                        console.error(
                            "Failed to destroy session:",
                            session.sessionId
                        );
                    }

                    resolve();
                });

            });
        }

        // Remove from Session collection
        await Session.deleteMany({
            userId: req.session.userId,
            sessionId: { $ne: currentSessionId }
        });

        await AuditLog.create({
            userId: req.session.userId,
            action: "logout all",
            ip: getRealIP(req),
            userAgent: req.headers["user-agent"],
            device: getDevice(req),
            location: await getLocation(req)
        });

        req.flash(
            "success",
            "All other devices have been logged out"
        );

        res.redirect("/sessions");

    } catch (err) {

        console.error("Logout all devices error:", err);

        req.flash(
            "error",
            "Failed to logout other devices"
        );

        res.redirect("/sessions");
    }
});

module.exports = router;