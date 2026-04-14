const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cartController');
const { authenticate } = require('../middlewares/auth');

// Все маршруты корзины требуют аутентификации
router.use(authenticate);

// Основные маршруты
router.get('/', CartController.getCart);
router.get('/summary', CartController.getCartSummary);
router.get('/validate-stock', CartController.validateStock);
router.delete('/clear', CartController.clearCart);

// Проверка наличия в корзине
router.get('/check/:productId', CartController.checkInCart);
router.post('/check-multiple', CartController.checkMultipleInCart);

// Управление товарами в корзине
router.post('/:productId', CartController.addToCart);
router.put('/:productId', CartController.updateCartItem);
router.delete('/:productId', CartController.removeFromCart);

// Дополнительные операции
router.post('/:productId/move-from-wishlist', CartController.moveFromWishlist);
router.post('/apply-promo', CartController.applyPromoCode);
router.post('/merge-guest-cart', CartController.mergeGuestCart);

module.exports = router;