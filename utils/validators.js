// Name validation
function isValidName(name) {
    return typeof name === "string" && name.trim().length >= 3 && name.length <= 50;
}

// Email validation (regex)
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Strong password validation
function isStrongPassword(password) {

    // return passwordRegex.test(password);
    return typeof password === "string" &&
        password.length <= 128 && // prevent abuse
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(password);
}

// Username validation (optional)
function isValidUsername(username) {
    if (!username) return true; // optional
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

module.exports = {
    isValidName,
    isValidEmail,
    isStrongPassword,
    isValidUsername
};