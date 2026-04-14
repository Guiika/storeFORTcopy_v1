const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const User = require('../models/User');

// Middleware для проверки JWT токена
const authenticate = async (req, res, next) => {
    try {
        // Получаем токен из заголовка Authorization
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        
        // Верифицируем токен
        const decoded = jwt.verify(token, jwtConfig.secret);
        
        // Ищем пользователя в базе данных
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Добавляем информацию о пользователе в запрос
        req.user = user;
        req.userId = decoded.userId;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        res.status(500).json({ error: 'Authentication failed' });
    }
};

// Middleware для проверки роли администратора
const isAdmin = async (req, res, next) => {
    try {
        const isAdmin = await User.isAdmin(req.userId);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Access denied. Admin only.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Authorization failed' });
    }
};

module.exports = {
    authenticate,
    isAdmin
};