const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const secretKey = process.env.ENCRYPTION_KEY || 'vOVH6sdmpBj89j6sNj89j6sNj89j6sNj'; // 32 chars
const ivLength = 16;

/**
 * Encrypts a string using AES-256-CBC
 * @param {string} text 
 * @returns {object} { encryptedData, iv }
 */
const encrypt = (text) => {
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted.toString('hex')
    };
};

/**
 * Decrypts a hex string using AES-256-CBC
 * @param {string} encryptedData 
 * @param {string} ivHex 
 * @returns {string} decrypted text
 */
const decrypt = (encryptedData, ivHex) => {
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedData, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};

/**
 * Masks sensitive data like bank account numbers or UPI IDs
 * @param {string} text 
 * @returns {string} masked text (e.g., XXXXXX1234)
 */
const maskData = (text) => {
    if (!text) return '';
    if (text.includes('@')) {
        // UPI ID masking: a***@upi
        const [user, domain] = text.split('@');
        return user.charAt(0) + '*'.repeat(user.length - 1) + '@' + domain;
    }
    // Bank Account masking: ******1234
    if (text.length > 4) {
        return '*'.repeat(text.length - 4) + text.slice(-4);
    }
    return '*'.repeat(text.length);
};

module.exports = { encrypt, decrypt, maskData };
