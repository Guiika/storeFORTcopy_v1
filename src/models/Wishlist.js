const db = require('../config/database');

class Wishlist {
    // Добавление товара в избранное
    static async add(userId, productId) {
        try {
            // Проверяем, существует ли товар
            const product = await db.get(
                'SELECT id, name, price FROM products WHERE id = ? AND is_active = 1',
                [productId]
            );
            
            if (!product) {
                throw new Error('Product not found or inactive');
            }
            
            // Добавляем в избранное
            const result = await db.run(
                'INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)',
                [userId, productId]
            );
            
            return { id: result.id, user_id: userId, product_id: productId, product };
        } catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
                throw new Error('Product already in wishlist');
            }
            throw error;
        }
    }

    // Удаление товара из избранного
    static async remove(userId, productId) {
        const result = await db.run(
            'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );
        
        return result.changes > 0;
    }

    // Получение всего избранного пользователя
    static async getUserWishlist(userId) {
        const items = await db.all(`
            SELECT w.id as wishlist_id, 
                   w.created_at as added_at,
                   p.*,
                   c.name as category_name,
                   (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as main_image
            FROM wishlist w
            JOIN products p ON w.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE w.user_id = ? AND p.is_active = 1
            ORDER BY w.created_at DESC
        `, [userId]);
        
        return items;
    }

    // Проверка, есть ли товар в избранном у пользователя
    static async isInWishlist(userId, productId) {
        const result = await db.get(
            'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );
        
        return !!result;
    }

    // Получение количества товаров в избранном
    static async getWishlistCount(userId) {
        const result = await db.get(
            'SELECT COUNT(*) as count FROM wishlist WHERE user_id = ?',
            [userId]
        );
        
        return result ? result.count : 0;
    }

    // Удаление нескольких товаров из избранного
    static async removeMultiple(userId, productIds) {
        if (!Array.isArray(productIds) || productIds.length === 0) {
            return 0;
        }
        
        const placeholders = productIds.map(() => '?').join(',');
        const result = await db.run(
            `DELETE FROM wishlist WHERE user_id = ? AND product_id IN (${placeholders})`,
            [userId, ...productIds]
        );
        
        return result.changes;
    }

    // Очистка всего избранного пользователя
    static async clearWishlist(userId) {
        const result = await db.run(
            'DELETE FROM wishlist WHERE user_id = ?',
            [userId]
        );
        
        return result.changes;
    }

    // Получение популярных товаров в избранном (для рекомендаций)
    static async getPopularWishlistItems(limit = 10) {
        const items = await db.all(`
            SELECT p.*, 
                   COUNT(w.product_id) as wishlist_count,
                   c.name as category_name,
                   (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as main_image
            FROM wishlist w
            JOIN products p ON w.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = 1
            GROUP BY w.product_id
            ORDER BY wishlist_count DESC
            LIMIT ?
        `, [limit]);
        
        return items;
    }

    // Получение пользователей, у которых есть данный товар в избранном
    static async getUsersWithProduct(productId) {
        const users = await db.all(
            'SELECT user_id FROM wishlist WHERE product_id = ?',
            [productId]
        );
        
        return users.map(u => u.user_id);
    }

    // Перемещение товара в корзину (удаление из избранного после добавления в корзину)
    static async moveToCart(userId, productId) {
        // Эта функция будет вызываться из корзины
        return await this.remove(userId, productId);
    }
}

module.exports = Wishlist;