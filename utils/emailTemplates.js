module.exports.securityAlertTemplate = ({ device, location, ip, time }) => {
    return `
        <div style="font-family: Arial; padding:20px;">
            <h2 style="color:#e11d48;">⚠️ Security Alert</h2>

            <p>We detected a login from a new device/location:</p>

            <table style="border-collapse: collapse;">
                <tr><td><b>Device:</b></td><td>${device}</td></tr>
                <tr><td><b>Location:</b></td><td>${location}</td></tr>
                <tr><td><b>IP:</b></td><td>${ip}</td></tr>
                <tr><td><b>Time:</b></td><td>${time}</td></tr>
            </table>

            <p style="margin-top:15px;">
                If this wasn't you, secure your account immediately.
            </p>
        </div>
    `;
};