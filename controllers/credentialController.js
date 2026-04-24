const Credential = require("../models/Credential");
const { encrypt, decrypt } = require("../utils/crypto");
const AuditLog = require("../models/AuditLog");
const { getDevice } = require("../utils/device");
const { getLocation } = require("../utils/location");
const PDFDocument = require("pdfkit");
const bcrypt = require("bcrypt");
const User = require("../models/User");

// ================= ADD CREDENTIAL (AJAX) =================

module.exports.addCredential = async (req, res) => {
    try {
        const { service, fields } = req.body;

        if (!service || !fields || !Array.isArray(fields)) {
            return res.status(400).json({
                success: false,
                message: "Invalid data"
            });
        }

        const key = Buffer.from(req.session.encryptionKey, "hex");

        const encryptedFields = fields.map(field => {
            if (["password", "otp", "code"].includes(field.type)) {
                return {
                    ...field,
                    value: encrypt(field.value, key)
                };
            }
            return field;
        });

        const newCredential = new Credential({
            userId: req.session.userId,
            service,
            fields: encryptedFields
        });

        await AuditLog.create({
            userId: req.session.userId,
            action: "add_credential",
            ip: req.ip,
            device: getDevice(req),
            location: await getLocation(req.ip)
        });

        await newCredential.save();

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// ================= GET EDIT PAGE =================
module.exports.getEditPage = async (req, res) => {

    try {
        const cred = await Credential.findById(req.params.id);

        if (!cred) return res.redirect("/dashboard");

        const key = Buffer.from(req.session.encryptionKey, "hex");

        const decryptedFields = cred.fields.map(field => {

            if (["password", "otp", "code"].includes(field.type)) {
                return {
                    ...field._doc,
                    value: decrypt(field.value, key)
                };
            }

            return field;
        });

        cred.fields = decryptedFields;

        const ejs = require("ejs");
        const fs = require("fs");
        const path = require("path");

        const content = fs.readFileSync(
            path.join(__dirname, "../views/dashboard/edit.ejs"),
            "utf-8"
        );

        const body = ejs.render(content, {
            cred,
            csrfToken: req.csrfToken()
        });

        res.render("layouts/app", {
            title: "Edit Credential",
            body
        });

    } catch (err) {
        console.error("Edit GET Error:", err);
        res.redirect("/dashboard");
    }
};

// ================= UPDATE CREDENTIAL =================
module.exports.updateCredential = async (req, res) => {

    try {
        const service = req.body.service;
        const rawFields = req.body.fields || {};

        const fields = Object.values(rawFields).filter(f => f.label && f.value);

        const key = Buffer.from(req.session.encryptionKey, "hex");

        const encryptedFields = fields.map(field => {

            if (["password", "otp", "code"].includes(field.type)) {
                return {
                    ...field,
                    value: encrypt(field.value, key)
                };
            }

            return field;
        });

        await Credential.findByIdAndUpdate(req.params.id, {
            service,
            fields: encryptedFields
        });

        await AuditLog.create({
            userId: req.session.userId,
            action: "update_credential",
            ip: req.ip,
            device: getDevice(req),
            location: await getLocation(req.ip)
        });

        res.redirect("/dashboard");

    } catch (err) {
        console.error("Update Error:", err);
        res.redirect("/dashboard");
    }
};

// ================= DELETE =================
module.exports.deleteCredential = async (req, res) => {

    try {
        await Credential.findByIdAndDelete(req.params.id);
        await AuditLog.create({
            userId: req.session.userId,
            action: "delete_credential",
            ip: req.ip,
            device: getDevice(req),
            location: await getLocation(req.ip)
        });
        res.redirect("/dashboard");

    } catch (err) {
        console.error("Delete Error:", err);
        res.redirect("/dashboard");
    }
};


module.exports.exportPDF = async (req, res) => {
    try {
        const { password } = req.body;

        const user = await User.findById(req.session.userId);

        // 🔐 VERIFY PASSWORD
        const isMatch = await bcrypt.compare(password, user.masterPassword);

        if (!isMatch) {
            return res.json({
                success: false,
                message: "Invalid password"
            });
        }

        // 🔑 DERIVE KEY AGAIN
        const { deriveKey, decrypt } = require("../utils/crypto");
        const key = deriveKey(password, user.salt);

        // 📦 GET CREDS
        const credentials = await Credential.find({
            userId: req.session.userId
        });


        const doc = new PDFDocument({
            margin: 50,
            size: "A4",
            bufferPages: true
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=credentials.pdf"
        );

        doc.pipe(res);


        // ================= FIRST PAGE HEADER =================
        doc
            .font("Helvetica-Bold")
            .fontSize(20)
            .fillColor("#111827")
            .text("LockForge Export", { align: "center" });

        doc.moveDown(0.5);

        doc
            .font("Helvetica")
            .fontSize(11)
            .fillColor("#6b7280")
            .text(`User: ${user.email}`, { align: "center" });

        doc.text(
            `Generated: ${new Date().toLocaleString()}`,
            { align: "center" }
        );

        doc.moveDown(1.5);

        // ================= CARD FUNCTION =================
        function drawCard(cred) {

            const cardWidth = doc.page.width - 100;
            const startX = 50;

            const padding = 12;
            const lineHeight = 16;

            const contentHeight = cred.fields.length * lineHeight;
            const cardHeight = 45 + contentHeight;

            // PAGE BREAK
            if (doc.y + cardHeight > doc.page.height - 100) {
                doc.addPage();
            }

            const y = doc.y;

            doc
                .roundedRect(startX, y, cardWidth, cardHeight, 6)
                .strokeColor("#d1d5db")
                .lineWidth(1)
                .stroke();

            doc
                .font("Helvetica-Bold")
                .fontSize(13)
                .fillColor("#2563eb")
                .text(cred.service, startX + padding, y + 10);

            let fieldY = y + 30;

            cred.fields.forEach(field => {

                let value = field.value;

                if (["password", "otp", "code"].includes(field.type)) {
                    value = decrypt(field.value, key);
                }

                doc
                    .font("Helvetica-Bold")
                    .fontSize(10)
                    .fillColor("#374151")
                    .text(`${field.label}: `, startX + padding, fieldY, {
                        continued: true
                    });

                doc
                    .font("Helvetica")
                    .fillColor("#111827")
                    .text(value);

                fieldY += lineHeight;
            });

            doc.y = y + cardHeight + 15;
        }

        // ================= RENDER =================
        credentials.forEach(drawCard);

        // ================= ADD LAST PAGE FOOTER (ONLY ONCE) =================

        // DO NOT addPage blindly
        if (doc.y > doc.page.height - 120) {
            doc.addPage();
        }

        doc.moveDown(2);

        doc
            .fontSize(10)
            .fillColor("#6b7280")
            .text("© 2026 LockForge. All rights reserved.", {
                align: "center"
            });

        doc.moveDown(0.5);

        doc
            .fontSize(9)
            .text("This document contains sensitive information. Keep it secure.", {
                align: "center"
            });


        doc.end();

        await AuditLog.create({
            userId: req.session.userId,
            action: "export_pdf",
            ip: req.ip,
            device: getDevice(req),
            location: await getLocation(req.ip)
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Export failed"
        });
    }
}; 