const UAParser = require("ua-parser-js");

module.exports.getDevice = (req) => {
    const ua = req.headers["user-agent"];
    const parser = new UAParser(ua);

    const device = parser.getDevice().type || "desktop";
    const browser = parser.getBrowser().name;
    const os = parser.getOS().name;

    return `${device} | ${browser} | ${os}`;
};