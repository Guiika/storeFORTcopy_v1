const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { 
    registerValidator, 
    loginValidator, 
    updateProfileValidator, 
    validate 
} = require('../utils/validators');

// Публичные маршруты
router.post('/register', registerValidator, validate, AuthController.register);
router.post('/login', loginValidator, validate, AuthController.login);

// Защищенные маршруты (требуется аутентификация)
router.get('/profile', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, updateProfileValidator, validate, AuthController.updateProfile);
router.put('/change-password', authenticate, AuthController.changePassword);
router.get('/validate-token', authenticate, AuthController.validateToken);

module.exports = router;