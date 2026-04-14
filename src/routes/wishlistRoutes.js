const express = require('express');
const router = express.Router();
const WishlistController = require('../controllers/wishlistController');
const { authenticate } = require('../middlewares/auth');

// Все маршруты избранного требуют аутентификации
router.use(authenticate);

// Основные маршруты
router.get('/', WishlistController.getWishlist);
router.get('/stats', WishlistController.getWishlistStats);
router.delete('/clear', WishlistController.clearWishlist);

// Проверка наличия в избранном
router.get('/check/:productId', WishlistController.checkInWishlist);
router.post('/check-multiple', WishlistController.checkMultipleInWishlist);

// Добавление/удаление товаров
router.post('/:productId', WishlistController.addToWishlist);
router.delete('/:productId', WishlistController.removeFromWishlist);
router.post('/remove-multiple', WishlistController.removeMultiple);

// Публичный маршрут (не требует аутентификации)
router.get('/popular', WishlistController.getPopularWishlistItems);

module.exports = router;