const flash = require("connect-flash");

module.exports = (app) => {

    app.use(flash());

    app.use((req, res, next) => {
        res.locals.isLoggedIn = !!req.session.userId;
        res.locals.user = req.session.user || null;
        res.locals.success = req.flash("success");
        res.locals.error = req.flash("error");
        next();
    });

    app.use((req, res, next) => {
        res.set("Cache-Control", "no-store");
        next();
    });
};