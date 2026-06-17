module.exports = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            allowUnknown: true
        });

        if (error) {
            const errors = {};

            error.details.forEach(err => {
                const key = err.path[0];
                errors[key] = err.message;
            });

            return res.json({
                success: false,
                errors
            });
        }
        req.body = value;
        next();
    };
};