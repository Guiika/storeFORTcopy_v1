require('dotenv').config();

const jwtConfig = {
    secret: process.env.JWT_SECRET || 'your_fallback_secret_key_change_this',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    algorithm: 'HS256'
};

module.exports = jwtConfig;