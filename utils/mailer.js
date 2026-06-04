const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS   // app password
    }
});

module.exports.sendAlert = async (to, subject, html) => {
    await transporter.sendMail({
        from: `"LockForge" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
    });
};