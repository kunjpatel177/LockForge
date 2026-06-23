const Joi = require("joi");

const registerSchema = Joi.object({
    fullName: Joi.string()
        .min(3)
        .max(50)
        .trim()
        .pattern(/^[A-Za-z]+(?:\s[A-Za-z]+)*$/) 
        .required()
        .messages({
            "string.pattern.base": "Full name must contain only letters",
            "string.empty": "Full name is required"
        }),

    email: Joi.string()
        .pattern(/^[a-zA-Z0-9]+([._%+-]?[a-zA-Z0-9]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+$/)
        .min(5)
        .max(100)
        .lowercase()
        .trim()
        .required()
        .messages({
            "string.email": "Please enter a valid email address",
            "string.empty": "Email is required",
            "string.min": "Email is too short",
            "string.max": "Email is too long",
            "string.pattern.base": "Invalid email format"
        }),

    username: Joi.string()
        .alphanum()
        .min(3)
        .max(20)
        .required()
        .messages({
            "string.pattern.base": "Full name must contain only letters",
            "string.empty": "Username is required"
        }),

    password: Joi.string()
        .min(8)
        .max(128)
        .pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/)
        .required()
        .messages({
            "string.pattern.base":
                "Password must contain uppercase, lowercase, number, and special character",
            "string.min": "Password must be at least 8 characters",
            "string.empty": "Password is required"
        })
});

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        "string.empty": "Email is required",
    }),
    password: Joi.string().required().messages({
        "string.empty": "Password is required",
    }),
});

const credentialSchema = Joi.object({
    service: Joi.string().required(),

    fields: Joi.array().items(
        Joi.object({
            label: Joi.string().required(),
            value: Joi.string().required(),
            type: Joi.string()
                .valid("text", "password", "otp")
                .default("text")
        })
    ).min(1).required()
});

module.exports = {
    registerSchema,
    loginSchema,
    credentialSchema
};