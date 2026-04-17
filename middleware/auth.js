module.exports = function isAuth(req, res, next) {

    if (!req.session || !req.session.userId) {
        return res.redirect("/login");
    }

    if (!req.session.encryptionKey) {
        req.session.destroy(() => {
            return res.redirect("/login");
        });
        return;
    }

    next();
};