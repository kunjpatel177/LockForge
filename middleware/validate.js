module.exports = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            allowUnknown: true   // ✅ FIX
        });

        // console.log("Error: ",error, "Value: ", value)

        if (error) {
            const errors = {};

            error.details.forEach(err => {
                const key = err.path[0];
                // console.log("Key is : " , key)
                errors[key] = err.message;
                // console.log("err message",err.message)
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