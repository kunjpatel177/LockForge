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
const inactivity = require("./middleware/inactivity");
const sessionCleanup = require("./middleware/sessionCleanup");
const startSessionCleaner = require("./utils/sessionCleaner");

const app = express();
app.set("trust proxy", 1);

// ================= DATABASE =================
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("DB connected");

        startSessionCleaner();   // ✅ ADD THIS
    })
    .catch(err => console.log(err));

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// ================= SECURITY =================
app.use(
    helmet({
        contentSecurityPolicy: false
    })
);

// ================= RATE LIMIT =================
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "Too many attempts. Try later."
});
app.use("/login", authLimiter);
app.use("/register", authLimiter);
app.use("/export", authLimiter);

// ================= SESSION =================
const store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI
});

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,

    store: store,
    // store: MongoStore.create({
    //     mongoUrl: process.env.MONGO_URI
    // }),

    cookie: {
        httpOnly: true,
        // secure: false,        // true in production (HTTPS)
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",      // ✅ IMPORTANT FIX
        maxAge: 1000 * 60 * 30
    }
}));

app.use(sessionCleanup);

app.use(inactivity);

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
        csrfToken: res.locals.csrfToken,
        isLoggedIn: res.locals.isLoggedIn,   // ✅ ADD THIS
        user: res.locals.user
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
        currentSessionId: req.sessionID,
        csrfToken: res.locals.csrfToken   // ✅ ADD THIS
    });

    res.render("layouts/app", {
        title: "Active Sessions",
        body
    });
});

// app.post("/sessions/logout", isAuth, async (req, res) => {

//     const { sessionId } = req.body;

//     // 🔥 1. Destroy actual session
//     store.destroy(sessionId, async (err) => {

//         if (err) {
//             console.error("Session destroy error:", err);
//             return res.redirect("/sessions");
//         }

//         // 🔥 2. Remove from your tracking collection
//         await Session.deleteOne({
//             sessionId,
//             userId: req.session.userId
//         });

//         // res.redirect("/sessions");
//         if (sessionId === req.sessionID) {
//             return res.redirect("/sessions");
//         }
//     });
// });

app.post("/sessions/logout", isAuth, async (req, res) => {

    const { sessionId } = req.body;

    if (sessionId === req.sessionID) {
        return res.redirect("/sessions");
    }

    store.destroy(sessionId, async (err) => {

        if (!err) {
            await Session.deleteOne({
                sessionId,
                userId: req.session.userId
            });
        }

        res.redirect("/sessions");
    });
});

app.get("/about", (req, res) => {

    const body = renderView("pages/about.ejs",{
        // csrfToken: res.locals.csrfToken,
        isLoggedIn: res.locals.isLoggedIn,   // ✅ ADD THIS
        // user: res.locals.user
    });

    res.render("layouts/clean", {
        title: "About",
        body
    });
});


app.get("/security", (req, res) => {

    const body = renderView("pages/security.ejs",{
        isLoggedIn: res.locals.isLoggedIn,
    });

    res.render("layouts/clean", {
        title: "Security",
        body
    });
});


// ================= ROUTES FILES =================
app.use("/", authRoutes);
app.use("/", credentialRoutes);

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {

    console.error("❌ ERROR:", err.message);

    if (err.code === "EBADCSRFTOKEN") {

        // 🔥 If request is AJAX → send JSON
        if (req.headers["content-type"] === "application/json") {
            return res.status(403).json({
                success: false,
                message: "Invalid CSRF token"
            });
        }

        // normal form
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
    console.log(`Server running on port ${PORT}`);
});