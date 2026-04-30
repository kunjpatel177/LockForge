const csrf = require("csurf");

module.exports = (app) => {

    const csrfProtection = csrf();

    app.use(csrfProtection);

    app.use((req, res, next) => {
        res.locals.csrfToken = req.csrfToken();
        next();
    });
};