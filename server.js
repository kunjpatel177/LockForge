require("dotenv").config();

const express = require("express");
const path = require("path");

const connectDB = require("./config/db");
const setupSession = require("./config/session");

const security = require("./middleware/security");
const globals = require("./middleware/globals");
const csrfSetup = require("./middleware/csrf");

const authRoutes = require("./routes/auth");
const credentialRoutes = require("./routes/credential");
const pageRoutes = require("./routes/pages");
const sessionRoutes = require("./routes/session");

const updateSession = require("./middleware/updateSession");
const inactivity = require("./middleware/inactivity");
const sessionCleanup = require("./middleware/sessionCleanup");


const app = express();
app.set("trust proxy", 1);

// DB
connectDB();

// BASIC
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// SECURITY
security(app);

// SESSION
const store = setupSession(app);

// GLOBALS
globals(app);

// CUSTOM MIDDLEWARE
app.use(sessionCleanup);
app.use(inactivity);
app.use(updateSession);

// CSRF
csrfSetup(app);

// VIEW
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ROUTES
app.use("/", pageRoutes);
app.use("/", authRoutes);
app.use("/", credentialRoutes);
app.use("/", sessionRoutes);


// ERROR HANDLER
app.use((err, req, res, next) => {

    console.error("ERROR:", err.message);

    if (err.code === "EBADCSRFTOKEN") {
        if (req.headers["content-type"] === "application/json") {
            return res.status(403).json({
                success: false,
                message: "Invalid CSRF token"
            });
        }
        return res.status(403).send("Invalid CSRF token");
    }

    res.status(500).json({
        success: false,
        message: "Something went wrong"
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));