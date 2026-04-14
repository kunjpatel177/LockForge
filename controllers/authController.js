const bcrypt = require("bcrypt")
const User = require("../models/User")
const { isValidName, isValidEmail, isStrongPassword, isValidUsername } = require("../utils/validators");
const { deriveKey } = require("../utils/crypto");
const crypto = require("crypto");

// module.exports.register = async (req, res) => {
//     try {
//         let { fullName, email, username, password } = req.body

//         fullName = fullName?.trim()
//         email = email?.toLowerCase().trim();
//         username = username?.trim();
//         console.log("-----------------------------") 

//         // ✅ Custom validations
//         if (!isValidName(fullName)) {
//             return res.send("Invalid full name (min 3 chars)");
//         }

//         if (!isValidEmail(email)) {
//             return res.send("Invalid email format");
//         }

//         if (!isStrongPassword(password)) {
//             return res.send("Password must be strong");
//         }

//         if (!isValidUsername(username)) {
//             return res.send("Invalid username");
//         }

//         // ✅ Check duplicates
//         const existingEmail = await User.findOne({ email });
//         if (existingEmail) {
//             return res.send("Email already registered");
//         }

//         if (username) {
//             const existingUsername = await User.findOne({ username });
//             if (existingUsername) {
//                 return res.send("Username already taken");
//             }
//         }

//         // 🔐 Hash password
//         const hashedPassword = await bcrypt.hash(password, 12);
//         const salt = crypto.randomBytes(16).toString("hex");

//         const newUser = new User({
//             fullName,
//             email,
//             username,
//             masterPassword: hashedPassword,
//             salt
//         });

//         await newUser.save();

//         req.flash("success", "Registration successful! Please login.");
//         res.redirect("/");

//     } catch (err) {
//         console.log(err)
//     }
// };

module.exports.register = async (req, res) => {
    try {
        let { fullName, email, username, password } = req.body;

        fullName = fullName?.trim();
        email = email?.toLowerCase().trim();
        username = username?.trim();

        const errors = {};

        // ✅ validations
        if (!isValidName(fullName)) {
            errors.fullName = "Full name must be at least 3 characters";
        }

        if (!isValidEmail(email)) {
            errors.email = "Invalid email format";
        }

        if (!isStrongPassword(password)) {
            errors.password = "Password must be strong";
        }

        if (!isValidUsername(username)) {
            errors.username = "Invalid username";
        }

        // ✅ duplicates
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            errors.email = "Email already registered";
        }


        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            errors.username = "Username already taken";
        }


        // ❌ if any error → re-render form
        if (Object.keys(errors).length > 0) {
            return res.render("auth/register", {
                errors,
                old: { fullName, email, username }
            });
        }

        // 🔐 continue if no error
        const hashedPassword = await bcrypt.hash(password, 12);
        const salt = crypto.randomBytes(16).toString("hex");

        const newUser = new User({
            fullName,
            email,
            username,
            masterPassword: hashedPassword,
            salt
        });

        await newUser.save();

        req.flash("success", "Registration successful!");
        res.redirect("/");

    } catch (err) {
        res.send(err);
    }
};

// module.exports.login = async (req, res) => {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });

//     // ❌ MUST RETURN
//     if (!user) {
//         req.flash("error", "Invalid email");
//         return res.redirect("/");
//     }

//     const isMatch = await bcrypt.compare(password, user.masterPassword);

//     if (!isMatch) {
//         req.flash("error", "Invalid password");
//         return res.redirect("/");
//     }

//     const key = deriveKey(password, user.salt);

//     req.session.regenerate((err) => {
//         if (err) return res.send("Error");

//         req.session.userId = user._id;
//         req.session.encryptionKey = key.toString("hex");

//         req.flash("success", "Login successful!");
//         res.redirect("/dashboard");
//     });
// };

module.exports.login = async (req, res) => {
    const { email, password } = req.body;

    const errors = {};
    const old = { email };

    const user = await User.findOne({ email });

    // ❌ email error
    if (!user) {
        errors.email = "Invalid email";
        return res.render("auth/login", { errors, old });
    }

    const isMatch = await bcrypt.compare(password, user.masterPassword);

    // ❌ password error
    if (!isMatch) {
        errors.password = "Invalid password";
        return res.render("auth/login", { errors, old });
    }

    // ✅ success
    const key = deriveKey(password, user.salt);

    req.session.regenerate((err) => {
        if (err) return res.send("Error");

        req.session.userId = user._id;
        req.session.encryptionKey = key.toString("hex");

        req.flash("success", "Login successful!");
        res.redirect("/dashboard");
    });
};

// module.exports.login = async (req, res) => {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user){
//         req.flash("error", "Invalid email")
//         // return res.send("Invalid credentials");
//     }

//     const isMatch = await bcrypt.compare(password, user.masterPassword);
//     if (!isMatch) {
//         req.flash("error", "Invalid Password")
//         // return res.send("Invalid credentials");
//     }

//     // 🔐 Derive encryption key
//     const salt = "global_salt"; // improve later
//     const key = deriveKey(password, user.salt);

//     req.session.regenerate((err) => {
//         if (err) return res.send("Error");

//         req.session.userId = user._id;
//         req.session.encryptionKey = key.toString("hex");

//         req.flash("success", "Login successful!")
//         res.redirect("/dashboard");
//     });
// };

// module.exports.logout = (req, res) => {
//     req.flash("success", "Logged out successfully!");

//     req.session.save(() => {
//         req.session.destroy(() => {
//             res.clearCookie("connect.sid");
//             res.redirect("/");
//         });
//     });
// }

// module.exports.login = async (req, res) => {
//     try {
//         let { email, password } = req.body;

//         email = email?.toLowerCase().trim();

//         if (!isValidEmail(email)) {
//             return res.send("Invalid credentials");
//         }

//         const user = await User.findOne({ email });

//         if (!user) {
//             return res.send("Invalid credentials");
//         }

//         const isMatch = await bcrypt.compare(password, user.masterPassword);

//         if (!isMatch) {
//             return res.send("Invalid credentials");
//         }

//         req.session.regenerate((err) => {
//             if (err) return res.send("Error");

//             req.session.userId = user._id;
//             res.redirect("/dashboard");
//         });

//     } catch (err) {
//         res.send("Login error");
//     }
// };