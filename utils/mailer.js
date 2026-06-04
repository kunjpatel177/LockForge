const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS   // app password
//     }
// });

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,

    family: 4, // Force IPv4

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },

    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
});

module.exports.sendAlert = async (to, subject, html) => {

    try {

        const info = await transporter.sendMail({
            from: `"LockForge" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });

        console.log("EMAIL SENT:", info.messageId);
        console.log("EMAIL RESPONSE:", info.response);

    } catch (err) {

        console.error("EMAIL ERROR:", err);

        throw err;
    }
};