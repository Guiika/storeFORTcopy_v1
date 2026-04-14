const db = require('../config/database');

class Cart {
    // Получение или создание корзины для пользователя
    static async getOrCreateCart(userId) {
        try {
            // Пытаемся найти существующую корзину
            let cart = await db.get('SELECT * FROM cart WHERE user_id = ?', [userId]);
            
            // Если корзины нет, создаём новую
            if (!cart) {
                const result = await db.run(
                    'INSERT INTO cart (user_id) VALUES (?)',
                    [userId]
                );
                cart = await db.get('SELECT * FROM cart WHERE id = ?', [result.id]);
            }
            
            return cart;
        } catch (error) {
            console.error('Error in getOrCreateCart:', error);
            throw error;
        }
    }

    // Добавление товара в корзину
    static async addItem(userId, productId, quantity = 1) {
        try {
            // Получаем или создаем корзину
            const cart = await this.getOrCreateCart(userId);
            
            // Проверяем наличие товара
            const product = await db.get(
                'SELECT id, name, price, stock_quantity FROM products WHERE id = ? AND is_active = 1',
                [productId]
            );
            
            if (!product) {
                throw new Error('Product not found or inactive');
            }
            
            if (product.stock_quantity < quantity) {
                throw new Error(`Only ${product.stock_quantity} items available in stock`);
            }
            
            // Проверяем, есть ли уже такой товар в корзине
            const existingItem = await db.get(
                'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?',
                [cart.id, productId]
            );
            
            let item;
            if (existingItem) {
                // Обновляем количество
                const newQuantity = existingItem.quantity + quantity;
                if (newQuantity > product.stock_quantity) {
                    throw new Error(`Cannot add more than ${product.stock_quantity} items`);
                }
                
                await db.run(
                    'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [newQuantity, existingItem.id]
                );
                item = await db.get('SELECT * FROM cart_items WHERE id = ?', [existingItem.id]);
            } else {
                // Добавляем новый товар
                const result = await db.run(
                    'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
                    [cart.id, productId, quantity]
                );
                item = await db.get('SELECT * FROM cart_items WHERE id = ?', [result.id]);
            }
            
            return item;
        } catch (error) {
            console.error('Error in addItem:', error);
            throw error;
        }
    }

    // Обновление количества товара
    static async updateItemQuantity(userId, productId, quantity) {
        try {
            if (quantity < 1) {
                throw new Error('Quantity must be at least 1');
            }
            
            const cart = await this.getOrCreateCart(userId);
            
            // Проверяем наличие товара
            const product = await db.get(
                'SELECT stock_quantity FROM products WHERE id = ? AND is_active = 1',
                [productId]
            );
            
            if (!product) {
                throw new Error('Product not found');
            }
            
            if (product.stock_quantity < quantity) {
                throw new Error(`Only ${product.stock_quantity} items available in stock`);
            }
            
            // Обновляем количество
            const result = await db.run(
                'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE cart_id = ? AND product_id = ?',
                [quantity, cart.id, productId]
            );
            
            if (result.changes === 0) {
                throw new Error('Item not found in cart');
            }
            
            return await db.get(
                'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?',
                [cart.id, productId]
            );
        } catch (error) {
            console.error('Error in updateItemQuantity:', error);
            throw error;
        }
    }

    // Удаление товара из корзины
    static async removeItem(userId, productId) {
        try {
            const cart = await this.getOrCreateCart(userId);
            
            const result = await db.run(
                'DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?',
                [cart.id, productId]
            );
            
            return result.changes > 0;
        } catch (error) {
            console.error('Error in removeItem:', error);
            throw error;
        }
    }

    // Получение всей корзины с деталями товаров
    static async getCart(userId) {
        try {
            const cart = await this.getOrCreateCart(userId);
            
            // Получаем все товары в корзине
            const items = await db.all(`
                SELECT ci.*,
                       p.name,
                       p.description,
                       p.price,
                       p.old_price,
                       p.sku,
                       p.stock_quantity,
                       p.color,
                       p.size,
                       p.brand,
                       c.name as category_name,
                       (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as main_image
                FROM cart_items ci
                JOIN products p ON ci.product_id = p.id
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE ci.cart_id = ?
                ORDER BY ci.added_at DESC
            `, [cart.id]);
            
            // Рассчитываем итоги
            let subtotal = 0;
            let totalDiscount = 0;
            
            items.forEach(item => {
                const itemTotal = item.price * item.quantity;
                subtotal += itemTotal;
                
                if (item.old_price) {
                    const itemDiscount = (item.old_price - item.price) * item.quantity;
                    totalDiscount += itemDiscount;
                }
            });
            
            return {
                cart_id: cart.id,
                user_id: userId,
                items,
                summary: {
                    items_count: items.reduce((sum, item) => sum + item.quantity, 0),
                    unique_items_count: items.length,
                    subtotal: parseFloat(subtotal.toFixed(2)),
                    total_discount: parseFloat(totalDiscount.toFixed(2)),
                    total: parseFloat((subtotal - totalDiscount).toFixed(2))
                }
            };
        } catch (error) {
            console.error('Error in getCart:', error);
            throw error;
        }
    }

    // Очистка корзины
    static async clearCart(userId) {
        try {
            const cart = await this.getOrCreateCart(userId);
            
            const result = await db.run(
                'DELETE FROM cart_items WHERE cart_id = ?',
                [cart.id]
            );
            
            return result.changes;
        } catch (error) {
            console.error('Error in clearCart:', error);
            throw error;
        }
    }

    // Получение количества товаров в корзине
    static async getCartCount(userId) {
        try {
            const cart = await this.getOrCreateCart(userId);
            
            const result = await db.get(`
                SELECT SUM(quantity) as count 
                FROM cart_items 
                WHERE cart_id = ?
            `, [cart.id]);
            
            return result ? result.count || 0 : 0;
        } catch (error) {
            console.error('Error in getCartCount:', error);
            return 0;
        }
    }

    // Проверка наличия товара в корзине
    static async isInCart(userId, productId) {
        try {
            const cart = await this.getOrCreateCart(userId);
            
            const item = await db.get(
                'SELECT id FROM cart_items WHERE cart_id = ? AND product_id = ?',
                [cart.id, productId]
            );
            
            return !!item;
        } catch (error) {
            console.error('Error in isInCart:', error);
            return false;
        }
    }

    // Получение количества конкретного товара в корзине
    static async getItemQuantity(userId, productId) {
        try {
            const cart = await this.getOrCreateCart(userId);
            
            const item = await db.get(
                'SELECT quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
                [cart.id, productId]
            );
            
            return item ? item.quantity : 0;
        } catch (error) {
            console.error('Error in getItemQuantity:', error);
            return 0;
        }
    }

    // Применение скидки к корзине (будет использоваться с промокодами позже)
    static async applyDiscount(userId, discountPercent) {
        try {
            const cart = await this.getCart(userId);
            
            const discountMultiplier = (100 - discountPercent) / 100;
            const newTotal = cart.summary.total * discountMultiplier;
            
            return {
                original_total: cart.summary.total,
                discount_percent: discountPercent,
                discount_amount: cart.summary.total - newTotal,
                new_total: parseFloat(newTotal.toFixed(2))
            };
        } catch (error) {
            console.error('Error in applyDiscount:', error);
            throw error;
        }
    }

    // Проверка доступности всех товаров в корзине
    static async validateStock(userId) {
        try {
            const cart = await this.getCart(userId);
            const unavailableItems = [];
            
            for (const item of cart.items) {
                if (item.quantity > item.stock_quantity) {
                    unavailableItems.push({
                        product_id: item.product_id,
                        name: item.name,
                        requested: item.quantity,
                        available: item.stock_quantity
                    });
                }
            }
            
            return {
                valid: unavailableItems.length === 0,
                unavailable_items: unavailableItems
            };
        } catch (error) {
            console.error('Error in validateStock:', error);
            throw error;
        }
    }

    // Перемещение товара из избранного в корзину
    static async moveFromWishlist(userId, productId, quantity = 1) {
        try {
            // Добавляем в корзину
            const item = await this.addItem(userId, productId, quantity);
            
            // Удаляем из избранного (вызовем через импорт позже в контроллере)
            return item;
        } catch (error) {
            console.error('Error in moveFromWishlist:', error);
            throw error;
        }
    }

    // Объединение гостевой корзины с корзиной пользователя (после логина)
    static async mergeGuestCart(userId, guestCartItems) {
        try {
            const results = {
                added: 0,
                failed: 0,
                errors: []
            };
            
            for (const item of guestCartItems) {
                try {
                    await this.addItem(userId, item.product_id, item.quantity);
                    results.added++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        product_id: item.product_id,
                        error: error.message
                    });
                }
            }
            
            return results;
        } catch (error) {
            console.error('Error in mergeGuestCart:', error);
            throw error;
        }
    }
}

module.exports = Cart;