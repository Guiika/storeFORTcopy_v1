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

// Дополнительные операции (должны быть выше /:productId)
router.post('/apply-promo', CartController.applyPromoCode);
router.post('/merge-guest-cart', CartController.mergeGuestCart);

// Управление товарами в корзине
router.post('/:productId', CartController.addToCart);
router.put('/:productId', CartController.updateCartItem);
router.delete('/:productId', CartController.removeFromCart);
router.post('/:productId/move-from-wishlist', CartController.moveFromWishlist);

module.exports = router;