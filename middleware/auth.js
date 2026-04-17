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


// module.exports = function isAuth(req, res, next) {
//     try {
//         // ✅ Check if session exists
//         if (!req.session || !req.session.userId) {
//             return res.redirect("/");
//         }

//         // ✅ Extra check: encryption key must exist
//         // (important for your password manager security)
//         if (!req.session.encryptionKey) {
//             req.session.destroy(() => {
//                 return res.redirect("/");
//             });
//             return;
//         }

//         // Check session expiration manually
//         if (req.session.cookie && req.session.cookie.expires) {
//             if (new Date(req.session.cookie.expires) < new Date()) {
//                 req.session.destroy(() => res.redirect("/"));
//                 return;
//             }
//         }

//         // ✅ Optional: attach userId to request (cleaner access)
//         req.userId = req.session.userId;

//         next();

//     } catch (err) {
//         return res.redirect("/");
//     }
// };