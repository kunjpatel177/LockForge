const bcrypt = require("bcrypt")
const User = require("../models/User")
const { isValidName, isValidEmail, isStrongPassword, isValidUsername } = require("../utils/validators");
const { deriveKey } = require("../utils/crypto");
const crypto = require("crypto");
const AuditLog = require("../models/AuditLog");
const { getDevice } = require("../utils/device");
const Session = require("../models/Session");
const { getLocation } = require("../utils/location");
const { sendAlert } = require("../utils/mailer");
const { generateOTP } = require("../utils/otp");
const { securityAlertTemplate } = require("../utils/emailTemplates");

module.exports.login = async (req, res) => {
    const { email, password } = req.body;

    const errors = {};

    const user = await User.findOne({ email });

    if (!user) {
        errors.email = "Invalid email";
        return res.json({ success: false, errors });
    }

    const isMatch = await bcrypt.compare(password, user.masterPassword);

    if (!isMatch) {
        errors.password = "Invalid password";
        return res.json({ success: false, errors });
    }

    // if (Object.keys(errors).length > 0) {
    //     console.log("Hello:   ",Object.keys(errors))
    //     return res.json({ success: false, errors });
    // }

    const key = deriveKey(password, user.salt);

    req.session.regenerate(async (err) => {
        if (err) return res.json({ success: false });

        req.session.userId = user._id;
        req.session.user = {
            name: user.fullName,
            email: user.email
        };
        req.session.encryptionKey = key.toString("hex");

        const currentDevice = getDevice(req);
        const currentIP = req.ip;
        const currentLocation = getLocation(currentIP);

        const lastLogin = await AuditLog.findOne({
            userId: user._id,
            action: "login"
        }).sort({ time: -1 });

        let suspicious = false;

        if (lastLogin) {
            if (
                lastLogin.device !== currentDevice ||
                lastLogin.location !== currentLocation
                //|| lastLogin.ip !== currentIP
            ) {
                suspicious = true;
            }
        }

        // store in session
        req.session.suspiciousLogin = suspicious;

        if (suspicious) {

            const location = getLocation(req.ip);
            const device = getDevice(req);

            const html = securityAlertTemplate({
                device,
                location,
                ip: req.ip,
                time: new Date().toLocaleString()
            });

            await sendAlert(user.email, "⚠️ New Login Alert", html);
        }

        if (suspicious) {

            const otp = generateOTP();

            // store OTP in session
            req.session.otp = otp;
            req.session.tempUserId = user._id;
            req.session.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 min

            const html = `
                            <h2>🔐 Verify Login</h2>
                            <p>Your OTP is:</p>
                            <h1>${otp}</h1>
                            <p>This OTP expires in 5 minutes.</p>
                                                                    `;

            await sendAlert(user.email, "OTP Verification", html);
            await AuditLog.create({
                userId: user._id,
                action: "login",
                ip: req.ip,
                userAgent: req.headers["user-agent"],
                device: getDevice(req),
                location: getLocation(req.ip)
            });

            return res.json({
                success: true,
                requireOTP: true
            });
        }


        // 🔥 AUDIT LOG
        await AuditLog.create({
            userId: user._id,
            action: "login",
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            device: getDevice(req),
            location: getLocation(req.ip)
        });

        await Session.create({
            userId: user._id,
            sessionId: req.sessionID,
            ip: req.ip,
            device: getDevice(req),
            location: getLocation(req.ip)
        });

        // res.json({ success: true });

        return res.json({
            success: true, csrfToken: req.csrfToken()   /* 🔥 NEW TOKEN */
        });
    });
};


module.exports.register = async (req, res) => {

    let { fullName, email, username, password } = req.body;
    // console.log("BODY:", req.body);
    console.log("Email:", email);

    const errors = {};

    const existingEmail = await User.findOne({ email });
    if (existingEmail) errors.email = "Email already exists";
    // if (!email) errors.email = "Enter Email"

    const existingUsername = await User.findOne({ username });
    if (existingUsername) errors.username = "Username taken";

    if (Object.keys(errors).length > 0) {
        console.log("Hello:   ", errors)
        return res.json({ success: false, errors });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const salt = crypto.randomBytes(16).toString("hex");

    await User.create({
        fullName,
        email,
        username,
        masterPassword: hashedPassword,
        salt
    });

    return res.json({ success: true });
};


module.exports.verifyOTP = async (req, res) => {
    console.log("BODY:", req.body);   // 🔥 ADD THIS
    const { otp } = req.body;

    console.log("SERVER OTP:", req.session.otp);
    console.log("USER OTP:", otp);

    if (!req.session.otp) {
        return res.json({ success: false, message: "No OTP found" });
    }

    if (Date.now() > req.session.otpExpiry) {
        return res.json({ success: false, message: "OTP expired" });
    }

    if (otp !== req.session.otp) {
        return res.json({ success: false, message: "Invalid OTP" });
    }

    req.session.userId = req.session.tempUserId;

    delete req.session.otp;
    delete req.session.tempUserId;
    delete req.session.otpExpiry;

    res.json({
        success: true,
        requireOTP: true,
        csrfToken: req.csrfToken()   // 🔥 NEW TOKEN
    });
};


module.exports.deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.json({
                success: false,
                message: "Password required"
            });
        }

        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(password, user.masterPassword);

        if (!isMatch) {
            return res.json({
                success: false,
                message: "Incorrect password"
            });
        }

        // 🔥 DELETE EVERYTHING RELATED
        const Credential = require("../models/Credential");
        const Session = require("../models/Session");
        const AuditLog = require("../models/AuditLog");

        await Credential.deleteMany({ userId: user._id });
        await Session.deleteMany({ userId: user._id });
        await AuditLog.deleteMany({ userId: user._id });
        await User.findByIdAndDelete(user._id);

        // 🔐 Destroy session
        req.session.destroy(() => {
            res.json({
                success: true
            });
        });

    } catch (err) {
        console.error("Delete Account Error:", err);
        res.json({
            success: false,
            message: "Something went wrong"
        });
    }
};

