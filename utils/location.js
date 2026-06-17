const axios = require("axios");

function getRealIP(req) {
    if (!req || !req.headers) return "127.0.0.1"; // 🔥 safety fallback

    let ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.headers["x-real-ip"] || req.ip;

    // if (ip === "::1") return "127.0.0.1";
    if (ip === "::1") {
        ip = "127.0.0.1"
        return ip;
    }
        

    if (ip.startsWith("::ffff:")) {
        ip = ip.replace("::ffff:", "");
    }

    return ip;
}

async function getLocation(req) {
    // CHECK CACHE FIRST
    if (req.session && req.session.location && req.session.location.ip === getRealIP(req)) {
        return req.session.location.value;
    }

    const ip = getRealIP(req);

    // local/dev case
    if (ip === "127.0.0.1" || ip.startsWith("192.168") || ip.startsWith("10.")) {
        return "Local Network";
    }

    try {
        const res = await axios.get(
            `http://ip-api.com/json/${ip}`,
            { timeout: 3000 }
        );

        if (res.data.status === "success") {
            const location = `${res.data.country}, ${res.data.city}`;

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