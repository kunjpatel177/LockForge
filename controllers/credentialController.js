const Credential = require("../models/Credential");
const { encrypt } = require("../utils/crypto");
const { decrypt } = require("../utils/crypto");
const sanitize = require("../utils/sanitize");

module.exports.addCredential = async (req, res) => {
    try {
        // const { service, fields } = req.body;
        const service = sanitize(req.body.service);
        // const { service } = req.body;
        const rawFields = req.body.fields || {};
        const fields = Object.values(rawFields).filter(f => {
            return f.label && f.value;
        });;

        const key = Buffer.from(req.session.encryptionKey, "hex");

        const encryptedFields = fields.map(field => {
            if (field.type === "password" || field.type === "otp" || field.type === "code") {
                return {
                    ...field,
                    value: encrypt(field.value, key)
                };
            }
            return field;
        });

        const credential = new Credential({
            userId: req.session.userId,
            service,
            fields: encryptedFields
        });

        await credential.save();

        res.redirect("/dashboard");

    } catch (err) {
        res.send("Error saving credential");
    }
};


module.exports.getCredentials = async (req, res) => {
    try {
        const key = Buffer.from(req.session.encryptionKey, "hex");

        const credentials = await Credential.find({
            userId: req.session.userId
        });

        const decryptedData = credentials.map(cred => {
            const fields = cred.fields.map(field => {
                if (field.type === "password" || field.type === "otp" || field.type === "code") {
                    return {
                        ...field._doc,
                        value: decrypt(field.value, key)
                    };
                }
                return field;
            });

            return {
                ...cred._doc,
                fields
            };
        });

        res.render("dashboard/index", { credentials: decryptedData });

    } catch (err) {
        res.send("Error fetching credentials");
    }
};

module.exports.deleteCredential = async (req, res) => {
    try {
        const { id } = req.params;

        await Credential.deleteOne({
            _id: id,
            userId: req.session.userId
        });

        res.redirect("/dashboard");

    } catch (err) {
        res.send("Error deleting credential");
    }
};


module.exports.renderEditPage = async (req, res) => {
    try {
        const key = Buffer.from(req.session.encryptionKey, "hex");

        const cred = await Credential.findOne({
            _id: req.params.id,
            userId: req.session.userId
        });

        if (!cred) return res.send("Not found");

        const fields = cred.fields.map(f => {
            let value = f.value;

            if (["password", "otp", "code"].includes(f.type)) {
                value = decrypt(f.value, key);
            }

            return {
                label: f.label,
                value: value,   // 👈 MUST be plain string
                type: f.type
            };
        });

        res.render("dashboard/edit", {
            cred: {
                _id: cred._id,
                service: cred.service,
                fields
            }
        });

    } catch (err) {
        console.error(err);
        res.send("Error");
    }
};


module.exports.updateCredential = async (req, res) => {
    const key = Buffer.from(req.session.encryptionKey, "hex");

    const fields = Object.values(req.body.fields || {}).map(f => {
        if (f.type === "password" || f.type === "otp" || f.type === "code") {
            return {
                ...f,
                value: encrypt(f.value, key)
            };
        }
        return f;
    });

    await Credential.updateOne(
        { _id: req.params.id, userId: req.session.userId },
        {
            service: req.body.service,
            fields
        }
    );

    res.redirect("/dashboard");
};


module.exports.getCredentials = async (req, res) => {
    try {
        // 🔐 Check encryption key
        if (!req.session.encryptionKey) {
            return res.redirect("/");
        }

        const key = Buffer.from(req.session.encryptionKey, "hex");

        // 🔍 Sanitize search input
        const search = sanitize(req.query.search || "");

        // 📦 Fetch credentials
        const credentials = await Credential.find({
            userId: req.session.userId,
            service: { $regex: search, $options: "i" }
        });

        // 🔓 Decrypt fields
        const decryptedData = credentials.map(cred => {
            const fields = cred.fields.map(field => {

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
                fields
            };
        });

        // 🎨 Render dashboard
        res.render("dashboard/index", {
            credentials: decryptedData,
            search
        });

    } catch (err) {
        console.error(err);
        res.send("Error fetching credentials");
    }
};