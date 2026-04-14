const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const db = require('../config/database');

class AdminController {
    // ============= УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ =============

    // Получение всех пользователей с пагинацией
    static async getAllUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            const search = req.query.search || '';
            
            let query = 'SELECT id, email, first_name, last_name, role, phone, created_at FROM users';
            const params = [];
            
            if (search) {
                query += ' WHERE email LIKE ? OR first_name LIKE ? OR last_name LIKE ?';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }
            
            // Получаем общее количество
            const countQuery = query.replace(
                'SELECT id, email, first_name, last_name, role, phone, created_at',
                'SELECT COUNT(*) as count'
            );
            const countResult = await db.get(countQuery, params);
            const total = countResult.count;
            
            // Добавляем пагинацию
            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);
            
            const users = await db.all(query, params);
            
            res.json({
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    total_pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Get all users error:', error);
            res.status(500).json({ error: 'Failed to get users' });
        }
    }

    // Получение пользователя по ID
    static async getUserById(req, res) {
        try {
            const { id } = req.params;
            
            const user = await User.findById(id);
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Получаем дополнительную статистику
            const [wishlistCount, cartItems, ordersCount] = await Promise.all([
                db.get('SELECT COUNT(*) as count FROM wishlist WHERE user_id = ?', [id]),
                (async () => {
                    const cart = await db.get('SELECT id FROM cart WHERE user_id = ?', [id]);
                    if (cart) {
                        return db.get(
                            'SELECT SUM(quantity) as count FROM cart_items WHERE cart_id = ?',
                            [cart.id]
                        );
                    }
                    return { count: 0 };
                })(),
                db.get('SELECT COUNT(*) as count FROM orders WHERE user_id = ?', [id]).catch(() => ({ count: 0 }))
            ]);
            
            res.json({
                user,
                statistics: {
                    wishlist_items: wishlistCount.count || 0,
                    cart_items: cartItems.count || 0,
                    orders_count: ordersCount.count || 0
                }
            });
        } catch (error) {
            console.error('Get user by id error:', error);
            res.status(500).json({ error: 'Failed to get user' });
        }
    }

    // Обновление роли пользователя
    static async updateUserRole(req, res) {
        try {
            const { id } = req.params;
            const { role } = req.body;
            
            if (!['USER', 'ADMIN'].includes(role)) {
                return res.status(400).json({ error: 'Invalid role. Must be USER or ADMIN' });
            }
            
            // Проверяем, что пользователь существует
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Не позволяем админу менять свою роль
            if (id == req.userId) {
                return res.status(403).json({ error: 'Cannot change your own role' });
            }
            
            await db.run('UPDATE users SET role = ? WHERE id = ?', [role, id]);
            
            res.json({
                message: 'User role updated successfully',
                user_id: parseInt(id),
                new_role: role
            });
        } catch (error) {
            console.error('Update user role error:', error);
            res.status(500).json({ error: 'Failed to update user role' });
        }
    }

    // Блокировка/разблокировка пользователя
    static async toggleUserStatus(req, res) {
        try {
            const { id } = req.params;
            const { is_active } = req.body;
            
            if (typeof is_active !== 'boolean') {
                return res.status(400).json({ error: 'is_active must be a boolean' });
            }
            
            // Проверяем, что пользователь существует
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Не позволяем админу блокировать себя
            if (id == req.userId) {
                return res.status(403).json({ error: 'Cannot change your own status' });
            }
            
            // Добавляем поле is_active в таблицу users если его нет
            try {
                await db.run('ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1');
            } catch (e) {
                // Колонка уже существует - игнорируем
            }
            
            await db.run('UPDATE users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);
            
            res.json({
                message: is_active ? 'User activated successfully' : 'User deactivated successfully',
                user_id: parseInt(id),
                is_active
            });
        } catch (error) {
            console.error('Toggle user status error:', error);
            res.status(500).json({ error: 'Failed to update user status' });
        }
    }

    // ============= УПРАВЛЕНИЕ ЗАКАЗАМИ =============

    // Получение всех заказов (заглушка, будет реализовано в этапе заказов)
    static async getAllOrders(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const status = req.query.status;
            
            // Проверяем, существует ли таблица orders
            const tableCheck = await db.get(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='orders'"
            );
            
            if (!tableCheck) {
                return res.json({
                    orders: [],
                    pagination: {
                        page,
                        limit,
                        total: 0,
                        total_pages: 0
                    },
                    message: 'Orders table not yet created'
                });
            }
            
            let query = 'SELECT * FROM orders';
            const params = [];
            
            if (status) {
                query += ' WHERE status = ?';
                params.push(status);
            }
            
            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, (page - 1) * limit);
            
            const orders = await db.all(query, params);
            
            // Получаем общее количество
            const countQuery = status ? 'SELECT COUNT(*) as count FROM orders WHERE status = ?' : 'SELECT COUNT(*) as count FROM orders';
            const countResult = await db.get(countQuery, status ? [status] : []);
            
            res.json({
                orders,
                pagination: {
                    page,
                    limit,
                    total: countResult.count,
                    total_pages: Math.ceil(countResult.count / limit)
                }
            });
        } catch (error) {
            console.error('Get all orders error:', error);
            res.status(500).json({ error: 'Failed to get orders' });
        }
    }

    // Обновление статуса заказа (заглушка)
    static async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
            
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ 
                    error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
                });
            }
            
            // Проверяем существование таблицы orders
            const tableCheck = await db.get(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='orders'"
            );
            
            if (!tableCheck) {
                return res.status(404).json({ error: 'Orders functionality not yet implemented' });
            }
            
            const result = await db.run(
                'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [status, id]
            );
            
            if (result.changes === 0) {
                return res.status(404).json({ error: 'Order not found' });
            }
            
            res.json({
                message: 'Order status updated successfully',
                order_id: parseInt(id),
                new_status: status
            });
        } catch (error) {
            console.error('Update order status error:', error);
            res.status(500).json({ error: 'Failed to update order status' });
        }
    }

    // ============= УПРАВЛЕНИЕ ТОВАРАМИ (дополнительные функции) =============

    // Массовое обновление цен
    static async bulkUpdatePrices(req, res) {
        try {
            const { products } = req.body;
            
            if (!Array.isArray(products) || products.length === 0) {
                return res.status(400).json({ error: 'Products array is required' });
            }
            
            const results = {
                success: [],
                failed: []
            };
            
            for (const item of products) {
                try {
                    const { id, price, old_price } = item;
                    
                    if (!id || !price) {
                        throw new Error('Product ID and price are required');
                    }
                    
                    const updateData = { price: parseFloat(price) };
                    if (old_price !== undefined) {
                        updateData.old_price = parseFloat(old_price);
                    }
                    
                    await Product.update(id, updateData);
                    results.success.push(id);
                } catch (error) {
                    results.failed.push({
                        product: item,
                        error: error.message
                    });
                }
            }
            
            res.json({
                message: `Updated ${results.success.length} products, ${results.failed.length} failed`,
                results
            });
        } catch (error) {
            console.error('Bulk update prices error:', error);
            res.status(500).json({ error: 'Failed to bulk update prices' });
        }
    }

    // Экспорт товаров в CSV
    static async exportProducts(req, res) {
        try {
            const products = await Product.findAll({ limit: 1000 });
            
            // Создаем CSV
            const fields = ['id', 'name', 'sku', 'price', 'old_price', 'stock_quantity', 'category_name', 'brand', 'color', 'size'];
            const csvRows = [];
            
            // Заголовки
            csvRows.push(fields.join(','));
            
            // Данные
            for (const product of products) {
                const row = fields.map(field => {
                    const value = product[field] || '';
                    // Экранируем запятые и кавычки
                    return `"${String(value).replace(/"/g, '""')}"`;
                });
                csvRows.push(row.join(','));
            }
            
            const csv = csvRows.join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=products-export.csv');
            res.send(csv);
        } catch (error) {
            console.error('Export products error:', error);
            res.status(500).json({ error: 'Failed to export products' });
        }
    }

    // ============= ДАШБОРД И СТАТИСТИКА =============

    // Получение статистики для дашборда
    static async getDashboardStats(req, res) {
        try {
            const [usersCount, productsCount, categoriesCount, ordersStats] = await Promise.all([
                db.get('SELECT COUNT(*) as count FROM users'),
                db.get('SELECT COUNT(*) as count FROM products WHERE is_active = 1'),
                db.get('SELECT COUNT(*) as count FROM categories WHERE is_active = 1'),
                (async () => {
                    try {
                        const total = await db.get('SELECT COUNT(*) as count FROM orders');
                        const pending = await db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");
                        return { total: total.count, pending: pending.count };
                    } catch {
                        return { total: 0, pending: 0 };
                    }
                })()
            ]);
            
            // Получаем последние заказы
            const recentOrders = [];
            try {
                const orders = await db.all(`
                    SELECT o.*, u.email 
                    FROM orders o
                    JOIN users u ON o.user_id = u.id
                    ORDER BY o.created_at DESC
                    LIMIT 5
                `);
                recentOrders.push(...orders);
            } catch {
                // Таблицы orders может не быть
            }
            
            // Получаем популярные товары (по просмотрам)
            const popularProducts = await db.all(`
                SELECT p.id, p.name, p.price, p.views,
                       (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as main_image
                FROM products p
                WHERE p.is_active = 1
                ORDER BY p.views DESC
                LIMIT 5
            `);
            
            // Товары с низким запасом
            const lowStockProducts = await db.all(`
                SELECT id, name, sku, stock_quantity
                FROM products
                WHERE is_active = 1 AND stock_quantity < 10
                ORDER BY stock_quantity ASC
                LIMIT 10
            `);
            
            res.json({
                overview: {
                    total_users: usersCount.count,
                    total_products: productsCount.count,
                    total_categories: categoriesCount.count,
                    total_orders: ordersStats.total,
                    pending_orders: ordersStats.pending
                },
                recent_orders: recentOrders,
                popular_products: popularProducts,
                low_stock_products: lowStockProducts,
                last_updated: new Date().toISOString()
            });
        } catch (error) {
            console.error('Get dashboard stats error:', error);
            res.status(500).json({ error: 'Failed to get dashboard statistics' });
        }
    }

    // Получение системной информации
    static async getSystemInfo(req, res) {
        try {
            // Размер базы данных
            const dbPath = process.env.DB_PATH || './database/store.db';
            const fs = require('fs');
            const stats = fs.statSync(dbPath);
            
            // Получаем информацию о таблицах
            const tables = await db.all(`
                SELECT name, sql 
                FROM sqlite_master 
                WHERE type='table' 
                ORDER BY name
            `);
            
            // Количество записей в каждой таблице
            const counts = {};
            for (const table of tables) {
                const result = await db.get(`SELECT COUNT(*) as count FROM ${table.name}`);
                counts[table.name] = result.count;
            }
            
            res.json({
                database: {
                    path: dbPath,
                    size_bytes: stats.size,
                    size_mb: (stats.size / (1024 * 1024)).toFixed(2),
                    last_modified: stats.mtime
                },
                tables: tables.map(t => ({
                    name: t.name,
                    rows: counts[t.name],
                    sql: t.sql
                })),
                environment: process.env.NODE_ENV || 'development',
                node_version: process.version,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Get system info error:', error);
            res.status(500).json({ error: 'Failed to get system information' });
        }
    }

    // Очистка неактивных данных (корзины старше N дней)
    static async cleanupOldData(req, res) {
        try {
            const { days = 30 } = req.query;
            
            // Удаляем корзины, не обновлявшиеся больше N дней
            const result = await db.run(`
                DELETE FROM cart 
                WHERE julianday('now') - julianday(updated_at) > ?
            `, [days]);
            
            res.json({
                message: 'Cleanup completed successfully',
                deleted_carts: result.changes,
                days_threshold: days
            });
        } catch (error) {
            console.error('Cleanup old data error:', error);
            res.status(500).json({ error: 'Failed to cleanup old data' });
        }
    }
}

module.exports = AdminController;