const express = require("express");
const router = express.Router();
const renderView = require("../utils/renderView");

const Credential = require("../models/Credential");
const AuditLog = require("../models/AuditLog");
const Session = require("../models/Session");
const { decrypt } = require("../utils/crypto");
const isAuth = require("../middleware/auth");

// HOME
router.get("/", (req, res) => {

    const body = renderView("pages/home.ejs", {
        csrfToken: res.locals.csrfToken,
        isLoggedIn: res.locals.isLoggedIn,
        user: res.locals.user
    });

    res.render("layouts/public", { title: "Home", body });
});

// LOGIN
router.get("/login", (req, res) => {
    const body = renderView("pages/login.ejs", {
        csrfToken: res.locals.csrfToken
    });
    res.render("layouts/auth", { title: "Login", body });
});

// REGISTER
router.get("/register", (req, res) => {
    const body = renderView("pages/register.ejs", {
        csrfToken: res.locals.csrfToken
    });
    res.render("layouts/auth", { title: "Register", body });
});

// DASHBOARD
router.get("/dashboard", isAuth, async (req, res) => {

    const credentialsRaw = await Credential.find({
        userId: req.session.userId
    });

    const key = Buffer.from(req.session.encryptionKey, "hex");

    const credentials = credentialsRaw.map(cred => ({
        ...cred._doc,
        fields: cred.fields.map(field =>
            ["password", "otp", "code"].includes(field.type)
                ? { ...field._doc, value: decrypt(field.value, key) }
                : field
        )
    }));

    const body = renderView("dashboard/index.ejs", {
        credentials,
        csrfToken: res.locals.csrfToken,
        suspiciousLogin: req.session.suspiciousLogin || false
    });

    req.session.suspiciousLogin = false;

    res.render("layouts/app", { title: "Dashboard", body });
});

// HISTORY
router.get("/history", isAuth, async (req, res) => {
    const logs = await AuditLog.find({ userId: req.session.userId }).sort({ time: -1 });

    const body = renderView("dashboard/history.ejs", { logs });

    res.render("layouts/app", { title: "History", body });
});

// SESSIONS
router.get("/sessions", isAuth, async (req, res) => {

    const sessions = await Session.find({
        userId: req.session.userId
    });

    const body = renderView("dashboard/sessions.ejs", {
        sessions,
        currentSessionId: req.sessionID,
        csrfToken: res.locals.csrfToken
    });

    res.render("layouts/app", { title: "Active Sessions", body });
});

// ABOUT / SECURITY
router.get("/about", (req, res) => {
    const body = renderView("pages/about.ejs", {
        isLoggedIn: res.locals.isLoggedIn
    });
    res.render("layouts/clean", { title: "About", body });
});

router.get("/security", (req, res) => {
    const body = renderView("pages/security.ejs", {
        isLoggedIn: res.locals.isLoggedIn
    });
    res.render("layouts/clean", { title: "Security", body });
});

module.exports = router;