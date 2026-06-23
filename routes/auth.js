const express = require("express");
const router = express.Router();
const fs = require("fs");
const ejs = require("ejs");

const { register, login, verifyOTP, resendOTP, deleteAccount } = require("../controllers/authController");
const AuditLog = require("../models/AuditLog");
const Session = require("../models/Session");
const { getDevice } = require("../utils/device");
const { getLocation, getRealIP } = require("../utils/location");
const validate = require("../middleware/validate");
const isAuth = require("../middleware/auth")
const { registerSchema, loginSchema } = require("../utils/joiSchemas");
const { maskEmail } = require("../utils/mask");


// REGISTER
router.post("/register", validate(registerSchema), register);

// LOGIN
router.post("/login", validate(loginSchema), login);


router.get("/logout", async (req, res) => {

    if (req.session.userId) {
        await AuditLog.create({
            userId: req.session.userId,
            action: "logout",
            ip: getRealIP(req),
            userAgent: req.headers["user-agent"],
            device: getDevice(req),
            location: await getLocation(req)
        });
    }

    const currentSessionId = req.sessionID;
    // console.log("Session ID: ", currentSessionId)

    req.session.destroy(async (err) => {

        if (!err) {
            // REMOVE from active sessions
            await Session.deleteOne({
                sessionId: currentSessionId
            });
        }
        else {
            console.log("Some error")
        }



        // res.redirect("/login");
        res.redirect("/");
    });
});

router.get("/verify-otp", (req, res) => {

    const maskedEmail = maskEmail(req.session.tempUser?.email);

    const body = fs.readFileSync("views/pages/verify-otp.ejs", "utf-8");

    res.render("layouts/auth", {
        title: "Verify OTP",
        body: ejs.render(body, {
            csrfToken: req.csrfToken(),
            maskedEmail
        }),
        csrfToken: req.csrfToken()
    });
});

router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);

router.get("/cancel-otp", (req, res) => {

    delete req.session.otp;
    delete req.session.tempUserId;
    delete req.session.tempUser;
    delete req.session.tempEncryptionKey;
    delete req.session.otpExpiry;

    res.redirect("/");
});

router.post("/delete-account", isAuth, deleteAccount);



module.exports = router;