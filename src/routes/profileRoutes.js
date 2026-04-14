const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/profileController');
const { authenticate } = require('../middlewares/auth');
const { validate, updateProfileValidator } = require('../utils/validators');

// Все маршруты профиля требуют аутентификации
router.use(authenticate);

// Основные маршруты профиля
router.get('/', ProfileController.getProfile);
router.put('/', updateProfileValidator, validate, ProfileController.updateProfile);
router.get('/stats', ProfileController.getUserStats);

// Управление email
router.put('/email', ProfileController.updateEmail);
router.get('/check-email', ProfileController.checkEmailAvailability);

// Удаление аккаунта
router.delete('/', ProfileController.deleteAccount);

module.exports = router;