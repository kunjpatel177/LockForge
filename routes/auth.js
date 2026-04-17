const express = require("express");
const router = express.Router();

const { register, login, verifyOTP } = require("../controllers/authController");
const AuditLog = require("../models/AuditLog");
const { getDevice } = require("../utils/device");
const { getLocation } = require("../utils/location");
const fs = require("fs");
const ejs = require("ejs");

// REGISTER
router.post("/register", register);

// LOGIN
router.post("/login", login);

// LOGOUT
// router.get("/logout", (req, res) => {

//     req.session.destroy(() => {
//         res.clearCookie("connect.sid");
//         res.redirect("/login");
//     });

// });

router.get("/logout", async (req, res) => {

    if (req.session.userId) {
        await AuditLog.create({
            userId: req.session.userId,
            action: "logout",
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            device: getDevice(req),
            location: getLocation(req.ip)
        });
    }

    req.session.destroy(() => {
        res.redirect("/login");
    });
});

// router.get("/verify-otp", (req, res) => {
//     res.render("pages/verify-otp", {
//         csrfToken: req.csrfToken()   // 🔥 VERY IMPORTANT
//     });
// });

router.get("/verify-otp", (req, res) => {

    const body = fs.readFileSync("views/pages/verify-otp.ejs", "utf-8");

    res.render("layouts/auth", {
        title: "Verify OTP",
        body: ejs.render(body, {
            csrfToken: req.csrfToken()
        }),
        csrfToken: req.csrfToken()
    });
});

router.post("/verify-otp", verifyOTP);






module.exports = router;