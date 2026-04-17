const Credential = require("../models/Credential");
const { encrypt, decrypt } = require("../utils/crypto");
const AuditLog = require("../models/AuditLog");
const { getDevice } = require("../utils/device");
const { getLocation } = require("../utils/location");

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
            location: getLocation(req.ip)
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

// module.exports.addCredential = async (req, res) => {

//     try {
//         const service = req.body.service;
//         const rawFields = req.body.fields || {};

//         const fields = Object.values(rawFields).filter(f => f.label && f.value);

//         const key = Buffer.from(req.session.encryptionKey, "hex");

//         const encryptedFields = fields.map(field => {

//             if (["password", "otp", "code"].includes(field.type)) {
//                 return {
//                     ...field,
//                     value: encrypt(field.value, key)
//                 };
//             }

//             return field;
//         });

//         const credential = new Credential({
//             userId: req.session.userId,
//             service,
//             fields: encryptedFields
//         });

//         await credential.save();

//         return res.json({ success: true });

//     } catch (err) {
//         console.error("Add Error:", err);
//         return res.json({ success: false });
//     }
// };



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

        // await AuditLog.create({
        //     userId: req.session.userId,
        //     action: "add_credential",
        //     ip: req.ip,
        //     device: getDevice(req)
        // });

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
            location: getLocation(req.ip)
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
            location: getLocation(req.ip)
        });
        res.redirect("/dashboard");

    } catch (err) {
        console.error("Delete Error:", err);
        res.redirect("/dashboard");
    }
};