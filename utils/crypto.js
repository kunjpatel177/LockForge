const crypto = require("crypto");

const algorithm = "aes-256-cbc";

// Derive key
function deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
}

// Encrypt
function encrypt(text, key) {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    return {
        iv: iv.toString("hex"),
        content: encrypted
    };
}

// Decrypt
function decrypt(encryptedData, key) {
    const iv = Buffer.from(encryptedData.iv, "hex");

    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    let decrypted = decipher.update(encryptedData.content, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

module.exports = { deriveKey, encrypt, decrypt };