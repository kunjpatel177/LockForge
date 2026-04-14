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
    /*
        Conditions:
        - Min 8 chars
        - At least 1 uppercase
        - At least 1 lowercase
        - At least 1 number
        - At least 1 special character
    */
    // const passwordRegex =
    //     /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

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