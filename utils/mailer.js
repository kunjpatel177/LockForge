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
        from: `"Password Manager" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
    });
};

// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false,
//     family: 4, // Force IPv4
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//     },
//     connectionTimeout: 60000,
//     greetingTimeout: 60000,
//     socketTimeout: 60000
// });

// module.exports.sendAlert = async (to, subject, html) => {

//     try {
//         const info = await transporter.sendMail({
//             from: `"LockForge" <${process.env.EMAIL_USER}>`,
//             to,
//             subject,
//             html
//         });
//     } catch (err) {
//         console.error("EMAIL ERROR:", err);
//         throw err;
//     }
// };