require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const flash = require("connect-flash")

const credentialRoutes = require("./routes/credential");
const authRoutes = require("./routes/auth");



const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// 🔗 DB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("DB connected"))
    .catch(err => console.log(err));
    
// 🛡️ Security Middleware
// app.use(helmet());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      },
    },
  })
);

app.use((req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    next();
});

// 🚫 Rate Limiting (protect login brute force)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);


// 📁 Static
app.use(express.static("public"));

// 🎨 View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// 🔐 Session Config
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI
    }),
    cookie: {
        httpOnly: true,
        secure: false, // true in production (HTTPS)
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 // 1 hour
    }
}));

app.use(flash());


app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

app.get("/", (req, res) => {
    res.render("auth/login", {
        errors: {},
        old: {}
    });
});

app.get("/register", (req, res) => {
    res.render("auth/register", {
        errors: {},
        old: {}
    });
});

app.use("/", authRoutes);
app.use("/", credentialRoutes);

// app.get("/dashboard", (req, res) => {
//     res.send("This is a dashboard")
// })

// Start
app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});