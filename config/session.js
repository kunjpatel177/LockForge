const session = require("express-session");
const MongoStore = require("connect-mongo").default;

module.exports = (app) => {

    const store = MongoStore.create({
        mongoUrl: process.env.MONGO_URI
    });

    app.use(session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        rolling: true,
        store,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 1000 * 60 * 30
        }
    }));

    return store;
};