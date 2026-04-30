const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

module.exports = (app) => {

    app.use(
        helmet({
            contentSecurityPolicy: false
        })
    );

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100
    });

    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 20,
        message: "Too many attempts. Try later."
    });

    app.use(limiter);
    app.use("/login", authLimiter);
    app.use("/register", authLimiter);
    app.use("/export", authLimiter);
};