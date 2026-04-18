require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const flash = require("connect-flash");
const csrf = require("csurf");
const ejs = require("ejs");
const fs = require("fs");

const authRoutes = require("./routes/auth");
const credentialRoutes = require("./routes/credential");
const isAuth = require("./middleware/auth");
const AuditLog = require("./models/AuditLog");
const { getDevice } = require("./utils/device");
const Credential = require("./models/Credential");
const { decrypt } = require("./utils/crypto");
const Session = require("./models/Session")
const updateSession = require("./middleware/updateSession");

const app = express();

// ================= DATABASE =================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ DB connected"))
    .catch(err => console.log(err));

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("trust proxy", 1);

// ================= SECURITY =================
app.use(
    helmet({
        contentSecurityPolicy: false
    })
);

// ================= RATE LIMIT =================
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
});
app.use(limiter);

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: "Too many login attempts. Try later."
});
app.use("/login", loginLimiter);

// ================= SESSION =================
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI
    }),

    cookie: {
        httpOnly: true,
        // secure: false,        // true in production (HTTPS)
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",      // ✅ IMPORTANT FIX
        maxAge: 1000 * 60 * 30
    }
}));

app.use((req, res, next) => {
    res.locals.isLoggedIn = !!req.session.userId;
    res.locals.user = req.session.user || null;  // 🔥 ADD THIS
    next();
});

// ================= FLASH =================
app.use(flash());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

// ================= NO CACHE =================
app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

// ================= CSRF (GLOBAL - FINAL FIX) =================
const csrfProtection = csrf();

app.use(csrfProtection);

app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
});

// ================= VIEW ENGINE =================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


// ================= HELPER =================
function renderView(viewPath, data = {}) {
    const content = fs.readFileSync(path.join(__dirname, "views", viewPath), "utf-8");
    return ejs.render(content, data);
}

// ================= ROUTES =================
// ---------- HOME ----------
app.get("/", (req, res) => {

    const body = renderView("pages/home.ejs", {
        csrfToken: res.locals.csrfToken
    });

    res.render("layouts/public", {
        title: "Home",
        body,
        csrfToken: res.locals.csrfToken
    });
});

app.use(updateSession);
// ---------- LOGIN ----------
app.get("/login", (req, res) => {

    const body = renderView("pages/login.ejs", {
        csrfToken: res.locals.csrfToken
    });

    res.render("layouts/auth", {
        title: "Login",
        body,
        csrfToken: res.locals.csrfToken
    });
});

// ---------- REGISTER ----------
app.get("/register", (req, res) => {

    const body = renderView("pages/register.ejs", {
        csrfToken: res.locals.csrfToken
    });

    res.render("layouts/auth", {
        title: "Register",
        body,
        csrfToken: res.locals.csrfToken
    });
});

// ---------- DASHBOARD ----------
app.get("/dashboard", isAuth, async (req, res) => {

    const credentialsRaw = await Credential.find({
        userId: req.session.userId
    });

    const key = Buffer.from(req.session.encryptionKey, "hex");

    const credentials = credentialsRaw.map(cred => {

        const decryptedFields = cred.fields.map(field => {

            if (["password", "otp", "code"].includes(field.type)) {
                return {
                    ...field._doc,
                    value: decrypt(field.value, key)
                };
            }

            return field;
        });

        return {
            ...cred._doc,
            fields: decryptedFields
        };
    });

    const body = renderView("dashboard/index.ejs", {
        credentials,
        csrfToken: res.locals.csrfToken,
        suspiciousLogin: req.session.suspiciousLogin || false
    });

    // reset after showing once
    req.session.suspiciousLogin = false;

    res.render("layouts/app", {
        title: "Dashboard",
        body,
        csrfToken: res.locals.csrfToken
    });
});

app.get("/history", isAuth, async (req, res) => {
    const logs = await AuditLog.find({
        userId: req.session.userId
    }).sort({ time: -1 });

    const body = renderView("dashboard/history.ejs", { logs });

    res.render("layouts/app", {
        title: "History",
        body
    });
});

app.get("/sessions", isAuth, async (req, res) => {

    const sessions = await Session.find({
        userId: req.session.userId
    });

    const body = renderView("dashboard/sessions.ejs", {
        sessions,
        currentSessionId: req.sessionID
    });

    res.render("layouts/app", {
        title: "Active Sessions",
        body
    });
});

app.post("/sessions/logout", isAuth, async (req, res) => {

    const { sessionId } = req.body;

    await Session.deleteOne({ sessionId });

    res.redirect("/sessions");
});

// ================= ROUTES FILES =================
app.use("/", authRoutes);
app.use("/", credentialRoutes);

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {

    console.error("❌ ERROR:", err.message);

    if (err.code === "EBADCSRFTOKEN") {
        return res.status(403).send("Invalid CSRF token");
    }

    res.status(500).json({
        success: false,
        message: "Something went wrong"
    });
});

// ================= SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});