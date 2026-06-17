const cron = require("node-cron");
const Session = require("../models/Session");
const AuditLog = require("../models/AuditLog");

function startSessionCleaner() {

/*
* * * * * *
| | | | | |
| | | | | └── Day of week (0-7)
| | | | └──── Month
| | | └────── Day of month
| | └──────── Hour
| └────────── Minute
└──────────── Second

field          allowed values
-----          --------------
second         0-59
minute         0-59
hour           0-23
day of month   1-31
month          1-12 (or names, see below)
day of week    0-7 (0 or 7 is Sunday, or use names)

*/

    cron.schedule("*/10 * * * * *", async () => {

        try {
            const now = new Date();

            // FIND EXPIRED SESSIONS
            const expiredSessions = await Session.find({
                expiresAt: { $lt: now }
            });

            for (let session of expiredSessions) {

                // CREATE LOG
                await AuditLog.create({
                    userId: session.userId,
                    action: "logout_expired",   // NEW TYPE
                    ip: session.ip,
                    device: session.device,
                    location: session.location,
                    time: new Date()
                });
            }

            // DELETE SESSIONS
            const result = await Session.deleteMany({
                expiresAt: { $lt: now }
            });

            if (result.deletedCount > 0) {
                console.log(`Removed ${result.deletedCount} expired sessions`);
            }

        } catch (err) {
            console.error("Session cleanup error:", err);
        }

    });
}

module.exports = startSessionCleaner;