function maskEmail(email) {
    if (!email) return "";

    const [name, domain] = email.split("@");

    // const maskedName =
    //     name.length <= 2
    //         ? name[0] + "*"
    //         : name.slice(0, 2) + "***";
    const maskedName =
    name.length <= 3
        ? name[0] + "***"
        : name.slice(0, 3) + "***";

    return `${maskedName}@${domain}`;
}

module.exports = { maskEmail };