const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

class WishlistController {
    // Получение избранного текущего пользователя
    static async getWishlist(req, res) {
        try {
            const userId = req.userId;
            
            const wishlist = await Wishlist.getUserWishlist(userId);
            const count = await Wishlist.getWishlistCount(userId);
            
            res.json({
                wishlist,
                count,
                message: wishlist.length === 0 ? 'Your wishlist is empty' : undefined
            });
        } catch (error) {
            console.error('Get wishlist error:', error);
            res.status(500).json({ error: 'Failed to get wishlist' });
        }
    }

    // Добавление товара в избранное
    static async addToWishlist(req, res) {
        try {
            const userId = req.userId;
            const { productId } = req.params;
            
            // Проверяем существование товара
            const product = await Product.findById(productId);
            if (!product || !product.is_active) {
                return res.status(404).json({ error: 'Product not found' });
            }
            
            // Добавляем в избранное
            const wishlistItem = await Wishlist.add(userId, productId);
            
            // Получаем обновленный список
            const wishlist = await Wishlist.getUserWishlist(userId);
            const count = await Wishlist.getWishlistCount(userId);
            
            res.status(201).json({
                message: 'Product added to wishlist',
                wishlist_item: wishlistItem,
                wishlist,
                count
            });
        } catch (error) {
            console.error('Add to wishlist error:', error);
            
            if (error.message === 'Product already in wishlist') {
                return res.status(409).json({ error: 'Product already in wishlist' });
            }
            if (error.message === 'Product not found or inactive') {
                return res.status(404).json({ error: error.message });
            }
            
            res.status(500).json({ error: 'Failed to add to wishlist' });
        }
    }

    // Удаление товара из избранного
    static async removeFromWishlist(req, res) {
        try {
            const userId = req.userId;
            const { productId } = req.params;
            
            const removed = await Wishlist.remove(userId, productId);
            
            if (!removed) {
                return res.status(404).json({ error: 'Product not found in wishlist' });
            }
            
            // Получаем обновленный список
            const wishlist = await Wishlist.getUserWishlist(userId);
            const count = await Wishlist.getWishlistCount(userId);
            
            res.json({
                message: 'Product removed from wishlist',
                wishlist,
                count
            });
        } catch (error) {
            console.error('Remove from wishlist error:', error);
            res.status(500).json({ error: 'Failed to remove from wishlist' });
        }
    }

    // Проверка, есть ли товар в избранном
    static async checkInWishlist(req, res) {
        try {
            const userId = req.userId;
            const { productId } = req.params;
            
            const isInWishlist = await Wishlist.isInWishlist(userId, productId);
            
            res.json({
                product_id: parseInt(productId),
                in_wishlist: isInWishlist
            });
        } catch (error) {
            console.error('Check wishlist error:', error);
            res.status(500).json({ error: 'Failed to check wishlist status' });
        }
    }

    // Проверка нескольких товаров (для списка товаров)
    static async checkMultipleInWishlist(req, res) {
        try {
            const userId = req.userId;
            const { productIds } = req.body;
            
            if (!Array.isArray(productIds) || productIds.length === 0) {
                return res.status(400).json({ error: 'Product IDs array is required' });
            }
            
            const results = {};
            
            for (const productId of productIds) {
                results[productId] = await Wishlist.isInWishlist(userId, productId);
            }
            
            res.json({
                results
            });
        } catch (error) {
            console.error('Check multiple wishlist error:', error);
            res.status(500).json({ error: 'Failed to check wishlist status' });
        }
    }

    // Удаление нескольких товаров из избранного
    static async removeMultiple(req, res) {
        try {
            const userId = req.userId;
            const { productIds } = req.body;
            
            if (!Array.isArray(productIds) || productIds.length === 0) {
                return res.status(400).json({ error: 'Product IDs array is required' });
            }
            
            const removedCount = await Wishlist.removeMultiple(userId, productIds);
            
            // Получаем обновленный список
            const wishlist = await Wishlist.getUserWishlist(userId);
            const count = await Wishlist.getWishlistCount(userId);
            
            res.json({
                message: `${removedCount} items removed from wishlist`,
                removed_count: removedCount,
                wishlist,
                count
            });
        } catch (error) {
            console.error('Remove multiple from wishlist error:', error);
            res.status(500).json({ error: 'Failed to remove items from wishlist' });
        }
    }

    // Очистка всего избранного
    static async clearWishlist(req, res) {
        try {
            const userId = req.userId;
            
            const removedCount = await Wishlist.clearWishlist(userId);
            
            res.json({
                message: 'Wishlist cleared successfully',
                removed_count: removedCount
            });
        } catch (error) {
            console.error('Clear wishlist error:', error);
            res.status(500).json({ error: 'Failed to clear wishlist' });
        }
    }

    // Получение популярных товаров в избранном (для всех пользователей)
    static async getPopularWishlistItems(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            
            const popularItems = await Wishlist.getPopularWishlistItems(limit);
            
            res.json({
                popular_items: popularItems,
                count: popularItems.length
            });
        } catch (error) {
            console.error('Get popular wishlist items error:', error);
            res.status(500).json({ error: 'Failed to get popular wishlist items' });
        }
    }

    // Получение статистики избранного для пользователя
    static async getWishlistStats(req, res) {
        try {
            const userId = req.userId;
            
            const count = await Wishlist.getWishlistCount(userId);
            const wishlist = await Wishlist.getUserWishlist(userId);
            
            // Вычисляем общую стоимость товаров в избранном
            const totalValue = wishlist.reduce((sum, item) => sum + (item.price || 0), 0);
            
            // Группировка по категориям
            const categoriesCount = {};
            wishlist.forEach(item => {
                const categoryName = item.category_name || 'Uncategorized';
                categoriesCount[categoryName] = (categoriesCount[categoryName] || 0) + 1;
            });
            
            res.json({
                count,
                total_value: totalValue,
                average_price: count > 0 ? totalValue / count : 0,
                categories: categoriesCount
            });
        } catch (error) {
            console.error('Get wishlist stats error:', error);
            res.status(500).json({ error: 'Failed to get wishlist statistics' });
        }
    }
}

module.exports = WishlistController;