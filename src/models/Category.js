const db = require('../config/database');

class Category {
    // Создание категории
    static async create(categoryData) {
        const { name, description, parent_id } = categoryData;
        
        try {
            // Проверяем, существует ли родительская категория (если указана)
            if (parent_id) {
                const parentCategory = await this.findById(parent_id);
                if (!parentCategory) {
                    throw new Error('Parent category not found');
                }
            }

            const result = await db.run(
                `INSERT INTO categories (name, description, parent_id) 
                 VALUES (?, ?, ?)`,
                [name, description, parent_id || null]
            );
            
            return this.findById(result.id);
        } catch (error) {
            // Проверяем на уникальность имени
            if (error.message.includes('UNIQUE constraint failed')) {
                throw new Error('Category with this name already exists');
            }
            throw error;
        }
    }

    // Поиск категории по ID
    static async findById(id) {
        const category = await db.get(`
            SELECT c.*, 
                   p.name as parent_name 
            FROM categories c
            LEFT JOIN categories p ON c.parent_id = p.id
            WHERE c.id = ?
        `, [id]);
        
        return category;
    }

    // Получение всех категорий с вложенностью
    static async findAll(includeInactive = false) {
        let query = `
            SELECT c.*, 
                   p.name as parent_name,
                   (SELECT COUNT(*) FROM products WHERE category_id = c.id) as product_count
            FROM categories c
            LEFT JOIN categories p ON c.parent_id = p.id
        `;
        
        if (!includeInactive) {
            query += ' WHERE c.is_active = 1';
        }
        
        query += ' ORDER BY c.parent_id, c.name';
        
        const categories = await db.all(query);
        
        // Формируем древовидную структуру
        return this.buildTree(categories);
    }

    // Построение древовидной структуры
    static buildTree(categories, parentId = null) {
        const result = [];
        
        categories.forEach(category => {
            if (category.parent_id === parentId) {
                const children = this.buildTree(categories, category.id);
                if (children.length > 0) {
                    category.children = children;
                }
                result.push(category);
            }
        });
        
        return result;
    }

    // Получение плоского списка категорий (для select options)
    static async findAllFlat() {
        const categories = await db.all(`
            SELECT id, name, parent_id 
            FROM categories 
            WHERE is_active = 1 
            ORDER BY name
        `);
        return categories;
    }

    // Обновление категории
    static async update(id, updateData) {
        const allowedFields = ['name', 'description', 'parent_id', 'is_active'];
        const updates = [];
        const values = [];
        
        // Проверка на циклические зависимости (категория не может быть родителем самой себя)
        if (updateData.parent_id === parseInt(id)) {
            throw new Error('Category cannot be parent of itself');
        }
        
        // Если меняется parent_id, проверяем существование родительской категории
        if (updateData.parent_id) {
            const parentCategory = await this.findById(updateData.parent_id);
            if (!parentCategory) {
                throw new Error('Parent category not found');
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
        
        values.push(id);
        
        await db.run(
            `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        return this.findById(id);
    }

    // Удаление категории (мягкое удаление - деактивация)
    static async delete(id) {
        // Проверяем, есть ли товары в этой категории
        const productsCount = await db.get(
            'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
            [id]
        );
        
        if (productsCount.count > 0) {
            throw new Error('Cannot delete category with products. Deactivate it instead.');
        }
        
        // Проверяем, есть ли подкатегории
        const subcategoriesCount = await db.get(
            'SELECT COUNT(*) as count FROM categories WHERE parent_id = ? AND is_active = 1',
            [id]
        );
        
        if (subcategoriesCount.count > 0) {
            throw new Error('Cannot delete category with active subcategories');
        }
        
        // Выполняем мягкое удаление
        await db.run('UPDATE categories SET is_active = 0 WHERE id = ?', [id]);
        return true;
    }

    // Полное удаление категории (только для администраторов)
    static async forceDelete(id) {
        // Перед полным удалением нужно переместить товары в другую категорию
        // или удалить их. В реальном приложении это делается через транзакцию.
        // Здесь просто удаляем для тестов.
        
        // Сначала удаляем подкатегории
        await db.run('DELETE FROM categories WHERE parent_id = ?', [id]);
        
        // Затем удаляем саму категорию
        const result = await db.run('DELETE FROM categories WHERE id = ?', [id]);
        return result.changes > 0;
    }

        // Добавляем новый метод для получения категорий с количеством товаров
    static async findAllWithProductCount(includeInactive = false) {
        let query = `
            SELECT c.*, 
                p.name as parent_name,
                (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = 1) as product_count
            FROM categories c
            LEFT JOIN categories p ON c.parent_id = p.id
        `;
        
        if (!includeInactive) {
            query += ' WHERE c.is_active = 1';
        }
        
        query += ' ORDER BY c.parent_id, c.name';
        
        const categories = await db.all(query);
        
        // Формируем древовидную структуру с количеством товаров
        const tree = this.buildTree(categories);
        
        // Добавляем общее количество товаров для родительских категорий
        this.calculateTotalProducts(tree);
        
        return tree;
    }

    // Вычисляем общее количество товаров во всех подкатегориях
    static calculateTotalProducts(categories) {
        categories.forEach(category => {
            let totalProducts = category.product_count || 0;
            
            if (category.children && category.children.length > 0) {
                this.calculateTotalProducts(category.children);
                category.children.forEach(child => {
                    totalProducts += child.total_products || child.product_count || 0;
                });
            }
            
            category.total_products = totalProducts;
        });
    }


    // Получение категории с товарами (для страницы категории)
    static async findByIdWithProducts(id) {
        try {
            const category = await this.findById(id);
            if (!category || !category.is_active) {
                return null;
            }
            
            return category;
        } catch (error) {
            console.error('Error in findByIdWithProducts:', error);
            return null;
        }
    }

    // Получение всех подкатегорий
    static async getAllSubcategories(parentId) {
        try {
            const subcategories = await db.all(
                'SELECT * FROM categories WHERE parent_id = ? AND is_active = 1',
                [parentId]
            );
            
            return subcategories;
        } catch (error) {
            console.error('Error in getAllSubcategories:', error);
            return [];
        }
    }

    // Получение категорий с количеством товаров
    static async findAllWithProductCount() {
        try {
            const categories = await db.all(`
                SELECT c.*, 
                       p.name as parent_name,
                       (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = 1) as product_count
                FROM categories c
                LEFT JOIN categories p ON c.parent_id = p.id
                WHERE c.is_active = 1
                ORDER BY c.parent_id, c.name
            `);
            
            return categories;
        } catch (error) {
            console.error('Error in findAllWithProductCount:', error);
            return [];
        }
    }
}

module.exports = Category;