function maskEmail(email) {
    if (!email) return "";

    const [name, domain] = email.split("@");

    const maskedName =
    name.length <= 5
        ? name[0] + "***"
        : name.slice(0, 5) + "***";

    return `${maskedName}@${domain}`;
}

module.exports = { maskEmail };