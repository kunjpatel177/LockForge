const express = require("express");
const router = express.Router();
const fs = require("fs");
const ejs = require("ejs");

const { register, login, verifyOTP, deleteAccount } = require("../controllers/authController");
const AuditLog = require("../models/AuditLog");
const { getDevice } = require("../utils/device");
const { getLocation } = require("../utils/location");
const validate = require("../middleware/validate");
const isAuth = require("../middleware/auth")
const { registerSchema, loginSchema } = require("../utils/joiSchemas");


// REGISTER
router.post("/register", validate(registerSchema), register);

// LOGIN
router.post("/login", validate(loginSchema), login);

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

router.post("/delete-account", isAuth, deleteAccount);



module.exports = router;