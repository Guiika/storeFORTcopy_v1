const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');

class CartController {
    // Получение корзины пользователя
    static async getCart(req, res) {
        try {
            const userId = req.userId;
            
            const cart = await Cart.getCart(userId);
            const count = await Cart.getCartCount(userId);
            
            res.json({
                ...cart,
                count
            });
        } catch (error) {
            console.error('Get cart error:', error);
            res.status(500).json({ error: 'Failed to get cart' });
        }
    }

    // Добавление товара в корзину
    static async addToCart(req, res) {
        try {
            const userId = req.userId;
            const { productId } = req.params;
            const { quantity = 1 } = req.body;
            
            // Валидация количества
            if (quantity < 1) {
                return res.status(400).json({ error: 'Quantity must be at least 1' });
            }
            
            // Добавляем в корзину
            const item = await Cart.addItem(userId, productId, quantity);
            
            // Получаем обновленную корзину
            const cart = await Cart.getCart(userId);
            const count = await Cart.getCartCount(userId);
            
            // Проверяем, есть ли товар в избранном (если да, предлагаем удалить)
            const isInWishlist = await Wishlist.isInWishlist(userId, productId);
            
            res.status(201).json({
                message: 'Product added to cart',
                cart_item: item,
                cart,
                count,
                wishlist_note: isInWishlist ? 'This item is also in your wishlist' : undefined
            });
        } catch (error) {
            console.error('Add to cart error:', error);
            
            if (error.message.includes('Only')) {
                return res.status(400).json({ error: error.message });
            }
            if (error.message.includes('Product not found')) {
                return res.status(404).json({ error: error.message });
            }
            
            res.status(500).json({ error: 'Failed to add to cart' });
        }
    }

    // Обновление количества товара
    static async updateCartItem(req, res) {
        try {
            const userId = req.userId;
            const { productId } = req.params;
            const { quantity } = req.body;
            
            // Валидация количества
            if (!quantity || quantity < 1) {
                return res.status(400).json({ error: 'Quantity must be at least 1' });
            }
            
            // Обновляем количество
            const updatedItem = await Cart.updateItemQuantity(userId, productId, quantity);
            
            // Получаем обновленную корзину
            const cart = await Cart.getCart(userId);
            const count = await Cart.getCartCount(userId);
            
            res.json({
                message: 'Cart updated successfully',
                updated_item: updatedItem,
                cart,
                count
            });
        } catch (error) {
            console.error('Update cart error:', error);
            
            if (error.message.includes('Only')) {
                return res.status(400).json({ error: error.message });
            }
            if (error.message.includes('Item not found')) {
                return res.status(404).json({ error: error.message });
            }
            
            res.status(500).json({ error: 'Failed to update cart' });
        }
    }

    // Удаление товара из корзины
    static async removeFromCart(req, res) {
        try {
            const userId = req.userId;
            const { productId } = req.params;
            
            const removed = await Cart.removeItem(userId, productId);
            
            if (!removed) {
                return res.status(404).json({ error: 'Item not found in cart' });
            }
            
            // Получаем обновленную корзину
            const cart = await Cart.getCart(userId);
            const count = await Cart.getCartCount(userId);
            
            res.json({
                message: 'Product removed from cart',
                cart,
                count
            });
        } catch (error) {
            console.error('Remove from cart error:', error);
            res.status(500).json({ error: 'Failed to remove from cart' });
        }
    }

    // Очистка корзины
    static async clearCart(req, res) {
        try {
            const userId = req.userId;
            
            const removedCount = await Cart.clearCart(userId);
            
            res.json({
                message: 'Cart cleared successfully',
                removed_count: removedCount
            });
        } catch (error) {
            console.error('Clear cart error:', error);
            res.status(500).json({ error: 'Failed to clear cart' });
        }
    }

    // Проверка наличия товара в корзине
    static async checkInCart(req, res) {
        try {
            const userId = req.userId;
            const { productId } = req.params;
            
            const inCart = await Cart.isInCart(userId, productId);
            const quantity = inCart ? await Cart.getItemQuantity(userId, productId) : 0;
            
            res.json({
                product_id: parseInt(productId),
                in_cart: inCart,
                quantity
            });
        } catch (error) {
            console.error('Check cart error:', error);
            res.status(500).json({ error: 'Failed to check cart' });
        }
    }

    // Проверка нескольких товаров
    static async checkMultipleInCart(req, res) {
        try {
            const userId = req.userId;
            const { productIds } = req.body;
            
            if (!Array.isArray(productIds) || productIds.length === 0) {
                return res.status(400).json({ error: 'Product IDs array is required' });
            }
            
            const results = {};
            
            for (const productId of productIds) {
                results[productId] = {
                    in_cart: await Cart.isInCart(userId, productId),
                    quantity: await Cart.getItemQuantity(userId, productId)
                };
            }
            
            res.json({ results });
        } catch (error) {
            console.error('Check multiple cart error:', error);
            res.status(500).json({ error: 'Failed to check cart' });
        }
    }

    // Валидация наличия товаров на складе
    static async validateStock(req, res) {
        try {
            const userId = req.userId;
            
            const validation = await Cart.validateStock(userId);
            
            res.json(validation);
        } catch (error) {
            console.error('Validate stock error:', error);
            res.status(500).json({ error: 'Failed to validate stock' });
        }
    }

    // Применение промокода (заглушка)
    static async applyPromoCode(req, res) {
        try {
            const userId = req.userId;
            const { promoCode } = req.body;
            
            // Здесь будет реальная логика проверки промокодов
            // Сейчас просто заглушка
            const mockPromoCodes = {
                'SAVE10': 10,
                'SAVE20': 20,
                'WELCOME15': 15
            };
            
            const discount = mockPromoCodes[promoCode];
            
            if (!discount) {
                return res.status(404).json({ error: 'Invalid promo code' });
            }
            
            const discountInfo = await Cart.applyDiscount(userId, discount);
            
            res.json({
                message: 'Promo code applied successfully',
                promo_code: promoCode,
                ...discountInfo
            });
        } catch (error) {
            console.error('Apply promo code error:', error);
            res.status(500).json({ error: 'Failed to apply promo code' });
        }
    }

    // Перемещение из избранного в корзину
    static async moveFromWishlist(req, res) {
        try {
            const userId = req.userId;
            const { productId } = req.params;
            const { quantity = 1 } = req.body;
            
            // Проверяем, есть ли в избранном
            const isInWishlist = await Wishlist.isInWishlist(userId, productId);
            
            if (!isInWishlist) {
                return res.status(404).json({ error: 'Product not found in wishlist' });
            }
            
            // Добавляем в корзину
            await Cart.addItem(userId, productId, quantity);
            
            // Удаляем из избранного
            await Wishlist.remove(userId, productId);
            
            // Получаем обновленные данные
            const cart = await Cart.getCart(userId);
            const wishlist = await Wishlist.getUserWishlist(userId);
            
            res.json({
                message: 'Product moved from wishlist to cart',
                cart,
                wishlist: {
                    items: wishlist,
                    count: wishlist.length
                }
            });
        } catch (error) {
            console.error('Move from wishlist error:', error);
            res.status(500).json({ error: 'Failed to move product from wishlist' });
        }
    }

    // Краткая информация о корзине (для хедера)
    static async getCartSummary(req, res) {
        try {
            const userId = req.userId;
            
            const count = await Cart.getCartCount(userId);
            const cart = await Cart.getCart(userId);
            
            res.json({
                count,
                subtotal: cart.summary.subtotal,
                total: cart.summary.total,
                items_count: cart.summary.items_count
            });
        } catch (error) {
            console.error('Get cart summary error:', error);
            res.status(500).json({ error: 'Failed to get cart summary' });
        }
    }

    // Объединение гостевой корзины (для использования после логина)
    static async mergeGuestCart(req, res) {
        try {
            const userId = req.userId;
            const { guestCart } = req.body;
            
            if (!Array.isArray(guestCart) || guestCart.length === 0) {
                return res.status(400).json({ error: 'Guest cart data is required' });
            }
            
            const results = await Cart.mergeGuestCart(userId, guestCart);
            
            // Получаем обновленную корзину
            const cart = await Cart.getCart(userId);
            
            res.json({
                message: 'Guest cart merged successfully',
                merge_results: results,
                cart
            });
        } catch (error) {
            console.error('Merge guest cart error:', error);
            res.status(500).json({ error: 'Failed to merge guest cart' });
        }
    }
}

module.exports = CartController;