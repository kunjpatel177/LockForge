module.exports = (req, res, next) => {

    const timeout = 30 * 60 * 1000; // 30 min

    if (req.session.lastActivity) {

        const now = Date.now();

        if (now - req.session.lastActivity > timeout) {
            return req.session.destroy(() => {
                res.redirect("/login");
            });
        }
    }

    req.session.lastActivity = Date.now();

    next();
};