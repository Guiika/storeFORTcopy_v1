const db = require('../config/database');

class Product {
    // Создание товара
    static async create(productData) {
        const {
            name, description, price, old_price, category_id, sku,
            stock_quantity, weight_kg, color, size, material, brand
        } = productData;
        
        try {
            // Проверяем существование категории
            if (category_id) {
                const category = await db.get('SELECT id FROM categories WHERE id = ? AND is_active = 1', [category_id]);
                if (!category) {
                    throw new Error('Category not found or inactive');
                }
            }

            // Генерируем SKU если не предоставлен
            const finalSku = sku || this.generateSKU(name);
            
            const result = await db.run(
                `INSERT INTO products (
                    name, description, price, old_price, category_id, sku,
                    stock_quantity, weight_kg, color, size, material, brand
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    name, description, price, old_price || null, category_id, finalSku,
                    stock_quantity || 0, weight_kg || 0, color, size, material, brand
                ]
            );
            
            return this.findById(result.id);
        } catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
                throw new Error('Product with this SKU already exists');
            }
            throw error;
        }
    }

    // Генерация SKU
    static generateSKU(name) {
        const prefix = name.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${timestamp}-${random}`;
    }

    // Поиск товара по ID
    static async findById(id) {
        const product = await db.get(`
            SELECT p.*, 
                   c.name as category_name,
                   c.parent_id as category_parent_id
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        `, [id]);
        
        if (!product) return null;
        
        // Получаем изображения товара
        const images = await db.all(
            'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_main DESC, display_order ASC',
            [id]
        );
        
        product.images = images;
        return product;
    }

    // Получение всех товаров с фильтрацией
    static async findAll(filters = {}) {
        const {
            category_id, min_price, max_price, in_stock_only = false,
            featured_only = false, search = '', limit = 50, offset = 0,
            sort_by = 'created_at', sort_order = 'DESC'
        } = filters;
        
        let query = `
            SELECT p.*, 
                   c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = 1
        `;
        
        const params = [];
        
        // Применяем фильтры
        if (category_id) {
            query += ' AND p.category_id = ?';
            params.push(category_id);
        }
        
        if (min_price !== undefined) {
            query += ' AND p.price >= ?';
            params.push(min_price);
        }
        
        if (max_price !== undefined) {
            query += ' AND p.price <= ?';
            params.push(max_price);
        }
        
        if (in_stock_only) {
            query += ' AND p.stock_quantity > 0';
        }
        
        if (featured_only) {
            query += ' AND p.is_featured = 1';
        }
        
        if (search) {
            query += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        // Валидация сортировки
        const validSortColumns = ['name', 'price', 'created_at', 'updated_at', 'stock_quantity'];
        const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
        const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        
        query += ` ORDER BY p.${sortColumn} ${sortDirection}`;
        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        const products = await db.all(query, params);
        
        // Получаем изображения для каждого товара
        for (const product of products) {
            const images = await db.all(
                'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_main DESC, display_order ASC LIMIT 1',
                [product.id]
            );
            product.main_image = images[0] || null;
        }
        
        return products;
    }

    // Получение количества товаров (для пагинации)
    static async count(filters = {}) {
        const {
            category_id, min_price, max_price, in_stock_only = false,
            featured_only = false, search = ''
        } = filters;
        
        let query = 'SELECT COUNT(*) as count FROM products WHERE is_active = 1';
        const params = [];
        
        // Применяем фильтры
        if (category_id) {
            query += ' AND category_id = ?';
            params.push(category_id);
        }
        
        if (min_price !== undefined) {
            query += ' AND price >= ?';
            params.push(min_price);
        }
        
        if (max_price !== undefined) {
            query += ' AND price <= ?';
            params.push(max_price);
        }
        
        if (in_stock_only) {
            query += ' AND stock_quantity > 0';
        }
        
        if (featured_only) {
            query += ' AND is_featured = 1';
        }
        
        if (search) {
            query += ' AND (name LIKE ? OR description LIKE ? OR brand LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        const result = await db.get(query, params);
        return result.count;
    }

    // Обновление товара
    static async update(id, updateData) {
        const allowedFields = [
            'name', 'description', 'price', 'old_price', 'category_id',
            'stock_quantity', 'is_active', 'is_featured', 'weight_kg',
            'color', 'size', 'material', 'brand'
        ];
        
        const updates = [];
        const values = [];
        
        // Проверка категории если она меняется
        if (updateData.category_id) {
            const category = await db.get('SELECT id FROM categories WHERE id = ? AND is_active = 1', [updateData.category_id]);
            if (!category) {
                throw new Error('Category not found or inactive');
            }
        }
        
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(updateData[field]);
            }
        });
        
        if (updates.length === 0) {
            throw new Error('No valid fields to update');
        }
        
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        
        await db.run(
            `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        return this.findById(id);
    }

    // Удаление товара (мягкое удаление)
    static async delete(id) {
        await db.run('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
        return true;
    }

    // Добавление изображения к товару
    static async addImage(productId, imageUrl, isMain = false) {
        try {
            // Если добавляем главное изображение, снимаем флаг с других
            if (isMain) {
                await db.run(
                    'UPDATE product_images SET is_main = 0 WHERE product_id = ?',
                    [productId]
                );
            }
            
            const result = await db.run(
                `INSERT INTO product_images (product_id, image_url, is_main) 
                 VALUES (?, ?, ?)`,
                [productId, imageUrl, isMain ? 1 : 0]
            );
            
            return result.id;
        } catch (error) {
            throw error;
        }
    }

    // Удаление изображения
    static async deleteImage(imageId) {
        const result = await db.run('DELETE FROM product_images WHERE id = ?', [imageId]);
        return result.changes > 0;
    }

    // Обновление информации об изображении
    static async updateImage(imageId, updateData) {
        const allowedFields = ['is_main', 'display_order'];
        const updates = [];
        const values = [];
        
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(updateData[field]);
            }
        });
        
        if (updates.length === 0) {
            throw new Error('No valid fields to update');
        }
        
        values.push(imageId);
        
        // Если устанавливаем главное изображение, снимаем флаг с других
        if (updateData.is_main) {
            const image = await db.get('SELECT product_id FROM product_images WHERE id = ?', [imageId]);
            if (image) {
                await db.run(
                    'UPDATE product_images SET is_main = 0 WHERE product_id = ? AND id != ?',
                    [image.product_id, imageId]
                );
            }
        }
        
        await db.run(
            `UPDATE product_images SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        return db.get('SELECT * FROM product_images WHERE id = ?', [imageId]);
    }

    // Получение изображений товара
    static async getImages(productId) {
        return await db.all(
            'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_main DESC, display_order ASC',
            [productId]
        );
    }

    // Проверка существования товара
    static async exists(productId) {
        const product = await db.get('SELECT id FROM products WHERE id = ? AND is_active = 1', [productId]);
        return !!product;
    }

    // Обновление количества на складе
    static async updateStock(productId, quantityChange) {
        const product = await db.get('SELECT stock_quantity FROM products WHERE id = ?', [productId]);
        if (!product) {
            throw new Error('Product not found');
        }
        
        const newQuantity = product.stock_quantity + quantityChange;
        if (newQuantity < 0) {
            throw new Error('Insufficient stock');
        }
        
        await db.run(
            'UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newQuantity, productId]
        );
        
        return newQuantity;
    }

    // Получение рекомендованных товаров
    static async getRecommended(productId, limit = 4) {
        // Получаем категорию текущего товара
        const product = await db.get(
            'SELECT category_id FROM products WHERE id = ?',
            [productId]
        );
        
        if (!product || !product.category_id) {
            return [];
        }
        
        // Получаем товары из той же категории, исключая текущий
        const recommended = await db.all(`
            SELECT p.*, 
                   c.name as category_name,
                   (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as main_image
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = 1 
              AND p.id != ? 
              AND p.category_id = ?
            ORDER BY RANDOM()
            LIMIT ?
        `, [productId, product.category_id, limit]);
        
        return recommended;
    }

    // Добавляем новые методы для каталога

    // Получение товаров по нескольким ID категорий
    static async findByCategoryIds(categoryIds, filters = {}) {
        if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
            return [];
        }
        
        const {
            min_price, max_price, in_stock_only = false,
            featured_only = false, search = '', limit = 50, offset = 0,
            sort_by = 'created_at', sort_order = 'DESC', colors, sizes, brands
        } = filters;
        
        // Создаем плейсхолдеры для IN условия
        const placeholders = categoryIds.map(() => '?').join(',');
        
        let query = `
            SELECT p.*, 
                c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = 1
            AND p.category_id IN (${placeholders})
        `;
        
        const params = [...categoryIds];
        
        // Применяем дополнительные фильтры
        if (min_price !== undefined) {
            query += ' AND p.price >= ?';
            params.push(min_price);
        }
        
        if (max_price !== undefined) {
            query += ' AND p.price <= ?';
            params.push(max_price);
        }
        
        if (in_stock_only) {
            query += ' AND p.stock_quantity > 0';
        }
        
        if (featured_only) {
            query += ' AND p.is_featured = 1';
        }
        
        if (search) {
            query += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        // Фильтрация по цветам
        if (colors && Array.isArray(colors) && colors.length > 0) {
            const colorPlaceholders = colors.map(() => '?').join(',');
            query += ` AND p.color IN (${colorPlaceholders})`;
            params.push(...colors);
        }
        
        // Фильтрация по размерам
        if (sizes && Array.isArray(sizes) && sizes.length > 0) {
            const sizePlaceholders = sizes.map(() => '?').join(',');
            query += ` AND p.size IN (${sizePlaceholders})`;
            params.push(...sizes);
        }
        
        // Фильтрация по брендам
        if (brands && Array.isArray(brands) && brands.length > 0) {
            const brandPlaceholders = brands.map(() => '?').join(',');
            query += ` AND p.brand IN (${brandPlaceholders})`;
            params.push(...brands);
        }
        
        // Валидация сортировки
        const validSortColumns = ['name', 'price', 'created_at', 'updated_at', 'stock_quantity'];
        const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
        const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        
        query += ` ORDER BY p.${sortColumn} ${sortDirection}`;
        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        const products = await db.all(query, params);
        
        // Получаем главное изображение для каждого товара
        for (const product of products) {
            const images = await db.all(
                'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_main DESC, display_order ASC LIMIT 1',
                [product.id]
            );
            product.main_image = images[0] || null;
        }
        
        return products;
    }

    // Получение фильтров для категории (цвета, размеры, бренды)
    static async getFiltersForCategory(categoryIds) {
        if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
            return { colors: [], sizes: [], brands: [], price_range: { min: 0, max: 0 } };
        }
        
        const placeholders = categoryIds.map(() => '?').join(',');
        
        // Получаем уникальные цвета
        const colors = await db.all(`
            SELECT DISTINCT color 
            FROM products 
            WHERE category_id IN (${placeholders}) 
            AND is_active = 1 
            AND color IS NOT NULL 
            AND color != ''
            ORDER BY color
        `, categoryIds);
        
        // Получаем уникальные размеры
        const sizes = await db.all(`
            SELECT DISTINCT size 
            FROM products 
            WHERE category_id IN (${placeholders}) 
            AND is_active = 1 
            AND size IS NOT NULL 
            AND size != ''
            ORDER BY size
        `, categoryIds);
        
        // Получаем уникальные бренды
        const brands = await db.all(`
            SELECT DISTINCT brand 
            FROM products 
            WHERE category_id IN (${placeholders}) 
            AND is_active = 1 
            AND brand IS NOT NULL 
            AND brand != ''
            ORDER BY brand
        `, categoryIds);
        
        // Получаем диапазон цен
        const priceRange = await db.get(`
            SELECT MIN(price) as min_price, MAX(price) as max_price
            FROM products 
            WHERE category_id IN (${placeholders}) 
            AND is_active = 1
        `, categoryIds);
        
        return {
            colors: colors.map(c => c.color),
            sizes: sizes.map(s => s.size),
            brands: brands.map(b => b.brand),
            price_range: {
                min: priceRange.min_price || 0,
                max: priceRange.max_price || 0
            }
        };
    }

    // Получение популярных товаров (по количеству просмотров/заказов - пока заглушка)
    static async getPopularProducts(limit = 8) {
        try {
            const products = await db.all(`
                SELECT p.*, 
                       c.name as category_name,
                       (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as main_image
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.is_active = 1 
                ORDER BY p.views DESC, p.stock_quantity DESC
                LIMIT ?
            `, [limit]);
            
            return products;
        } catch (error) {
            console.error('Error in getPopularProducts:', error);
            return [];
        }
    }

    // Получение новых поступлений
    static async getNewArrivals(limit = 8) {
        try {
            const products = await db.all(`
                SELECT p.*, 
                       c.name as category_name,
                       (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as main_image
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.is_active = 1
                ORDER BY p.created_at DESC
                LIMIT ?
            `, [limit]);
            
            return products;
        } catch (error) {
            console.error('Error in getNewArrivals:', error);
            return [];
        }
    }

    // Получение товаров со скидкой
    static async getDiscountedProducts(limit = 8) {
        try {
            const products = await db.all(`
                SELECT p.*, 
                       c.name as category_name,
                       (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as main_image,
                       ROUND(((p.old_price - p.price) / p.old_price) * 100) as discount_percent
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.is_active = 1 
                  AND p.old_price IS NOT NULL 
                  AND p.old_price > p.price
                ORDER BY discount_percent DESC
                LIMIT ?
            `, [limit]);
            
            return products;
        } catch (error) {
            console.error('Error in getDiscountedProducts:', error);
            return [];
        }
    }

    // Увеличение счетчика просмотров товара (ИСПРАВЛЕНО)
    static async incrementViews(productId) {
        try {
            // Сначала проверяем, существует ли колонка views
            const tableInfo = await db.all("PRAGMA table_info(products)");
            const hasViewsColumn = tableInfo.some(column => column.name === 'views');
            
            if (!hasViewsColumn) {
                // Добавляем колонку views если её нет
                await db.run('ALTER TABLE products ADD COLUMN views INTEGER DEFAULT 0');
            }
            
            await db.run(
                'UPDATE products SET views = IFNULL(views, 0) + 1 WHERE id = ?',
                [productId]
            );
            return true;
        } catch (error) {
            console.error('Error incrementing views:', error);
            return false;
        }
    }

    // Поиск по нескольким категориям
    static async findByCategoryIds(categoryIds, filters = {}) {
        try {
            if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
                return [];
            }
            
            const {
                min_price, max_price, in_stock_only = false,
                limit = 50, offset = 0,
                sort_by = 'created_at', sort_order = 'DESC'
            } = filters;
            
            const placeholders = categoryIds.map(() => '?').join(',');
            
            let query = `
                SELECT p.*, 
                       c.name as category_name
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.is_active = 1
                  AND p.category_id IN (${placeholders})
            `;
            
            const params = [...categoryIds];
            
            if (min_price !== undefined) {
                query += ' AND p.price >= ?';
                params.push(min_price);
            }
            
            if (max_price !== undefined) {
                query += ' AND p.price <= ?';
                params.push(max_price);
            }
            
            if (in_stock_only) {
                query += ' AND p.stock_quantity > 0';
            }
            
            const validSortColumns = ['name', 'price', 'created_at'];
            const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
            const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
            
            query += ` ORDER BY p.${sortColumn} ${sortDirection}`;
            query += ' LIMIT ? OFFSET ?';
            params.push(limit, offset);
            
            const products = await db.all(query, params);
            
            // Получаем главное изображение для каждого товара
            for (const product of products) {
                const images = await db.all(
                    'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_main DESC, display_order ASC LIMIT 1',
                    [product.id]
                );
                product.main_image = images[0] || null;
            }
            
            return products;
        } catch (error) {
            console.error('Error in findByCategoryIds:', error);
            return [];
        }
    }

    // Получение фильтров для категории
    static async getFiltersForCategory(categoryIds) {
        try {
            if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
                return { colors: [], sizes: [], brands: [], price_range: { min: 0, max: 0 } };
            }
            
            const placeholders = categoryIds.map(() => '?').join(',');
            
            const [colors, sizes, brands, priceRange] = await Promise.all([
                db.all(`
                    SELECT DISTINCT color 
                    FROM products 
                    WHERE category_id IN (${placeholders}) 
                      AND is_active = 1 
                      AND color IS NOT NULL 
                      AND color != ''
                    ORDER BY color
                `, categoryIds),
                
                db.all(`
                    SELECT DISTINCT size 
                    FROM products 
                    WHERE category_id IN (${placeholders}) 
                      AND is_active = 1 
                      AND size IS NOT NULL 
                      AND size != ''
                    ORDER BY size
                `, categoryIds),
                
                db.all(`
                    SELECT DISTINCT brand 
                    FROM products 
                    WHERE category_id IN (${placeholders}) 
                      AND is_active = 1 
                      AND brand IS NOT NULL 
                      AND brand != ''
                    ORDER BY brand
                `, categoryIds),
                
                db.get(`
                    SELECT MIN(price) as min_price, MAX(price) as max_price
                    FROM products 
                    WHERE category_id IN (${placeholders}) 
                      AND is_active = 1
                `, categoryIds)
            ]);
            
            return {
                colors: colors.map(c => c.color),
                sizes: sizes.map(s => s.size),
                brands: brands.map(b => b.brand),
                price_range: {
                    min: priceRange ? priceRange.min_price || 0 : 0,
                    max: priceRange ? priceRange.max_price || 0 : 0
                }
            };
        } catch (error) {
            console.error('Error in getFiltersForCategory:', error);
            return { colors: [], sizes: [], brands: [], price_range: { min: 0, max: 0 } };
        }
    }
}

module.exports = Product;