const Joi = require("joi");

// ================= REGISTER =================
const registerSchema = Joi.object({
    fullName: Joi.string().min(3).max(50).required(),

    email: Joi.string().email().required(),

    username: Joi.string()
        .alphanum()
        .min(3)
        .max(20)
        .required(), 

    password: Joi.string()
        .min(8)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
        .required()
});

// ================= LOGIN =================
const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// ================= ADD CREDENTIAL =================
const credentialSchema = Joi.object({
    service: Joi.string().required(),

    fields: Joi.array().items(
        Joi.object({
            label: Joi.string().required(),
            value: Joi.string().required(),
            type: Joi.string()
                .valid("text", "password", "otp", "code")
                .default("text")
        })
    ).min(1).required()
});

module.exports = {
    registerSchema,
    loginSchema,
    credentialSchema
};