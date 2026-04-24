// const geoip = require("geoip-lite");

// module.exports.getLocation = (ip) => {
//     // Handle localhost
//     if (ip === "::1" || ip === "127.0.0.1") {
//         return "Localhost";
//     }

//     const geo = geoip.lookup(ip);

//     if (!geo) return "Unknown";

//     return `${geo.country}, ${geo.city || "Unknown City"}`;
// };

const axios = require("axios");

function getRealIP(req) {
    if (!req || !req.headers) return "127.0.0.1"; // 🔥 safety fallback

    let ip =
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.headers["x-real-ip"] ||
        req.ip;

    if (ip === "::1") return "127.0.0.1";

    if (ip.startsWith("::ffff:")) {
        ip = ip.replace("::ffff:", "");
    }

    return ip;
}

async function getLocation(req) {

    // ✅ 1. CHECK CACHE FIRST (ADD THIS AT TOP)
    if (
        req.session &&
        req.session.location &&
        req.session.location.ip === getRealIP(req)
    ) {
        return req.session.location.value;
    }

    const ip = getRealIP(req);

    // local/dev case
    if (
        ip === "127.0.0.1" ||
        ip.startsWith("192.168") ||
        ip.startsWith("10.")
    ) {
        return "Local Network";
    }

    try {
        const res = await axios.get(`http://ip-api.com/json/${ip}`);

        if (res.data.status === "success") {

            const location = `${res.data.country}, ${res.data.city}`;

            // ✅ 2. SAVE IN SESSION (ADD THIS)
            if (req.session) {
                req.session.location = {
                    ip,
                    value: location
                };
            }

            return location;
        }

        return "Unknown";

    } catch (err) {
        console.error("IP API error:", err.message);
        return "Unknown";
    }
}

module.exports = { getLocation, getRealIP };