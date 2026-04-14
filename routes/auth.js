const express = require("express");
const router = express.Router();

const { register, login, logout } = require("../controllers/authController");

// Register route
router.post("/register", register);

// Login route
router.post("/login", login);

// router.get("/logout", logout);
router.post("/logout", (req, res) => {
    // store flash temporarily
    req.session.flash = {
        success: ["Logged out successfully!"]
    };

    req.session.destroy(err => {
        if (err) return res.redirect("/dashboard");

        res.clearCookie("connect.sid");
        res.redirect("/");
    });
});
module.exports = router;