const geoip = require("geoip-lite");

module.exports.getLocation = (ip) => {
    // Handle localhost
    if (ip === "::1" || ip === "127.0.0.1") {
        return "Localhost";
    }

    const geo = geoip.lookup(ip);

    if (!geo) return "Unknown";

    return `${geo.country}, ${geo.city || "Unknown City"}`;
};