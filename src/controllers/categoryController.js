const Category = require('../models/Category');

class CategoryController {
    // Создание категории (только для администраторов)
    static async createCategory(req, res) {
        try {
            const categoryData = req.body;
            const category = await Category.create(categoryData);
            
            res.status(201).json({
                message: 'Category created successfully',
                category
            });
        } catch (error) {
            console.error('Create category error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Получение всех категорий (публичный доступ)
    static async getAllCategories(req, res) {
        try {
            const includeInactive = req.query.includeInactive === 'true';
            const categories = await Category.findAll(includeInactive);
            
            res.json({
                categories,
                count: categories.length
            });
        } catch (error) {
            console.error('Get categories error:', error);
            res.status(500).json({ error: 'Failed to get categories' });
        }
    }

    // Получение плоского списка категорий (публичный доступ)
    static async getAllCategoriesFlat(req, res) {
        try {
            const categories = await Category.findAllFlat();
            
            res.json({
                categories,
                count: categories.length
            });
        } catch (error) {
            console.error('Get flat categories error:', error);
            res.status(500).json({ error: 'Failed to get categories' });
        }
    }

    // Получение одной категории по ID (публичный доступ)
    static async getCategoryById(req, res) {
        try {
            const { id } = req.params;
            const category = await Category.findById(id);
            
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }
            
            res.json({ category });
        } catch (error) {
            console.error('Get category error:', error);
            res.status(500).json({ error: 'Failed to get category' });
        }
    }

    // Обновление категории (только для администраторов)
    static async updateCategory(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            const updatedCategory = await Category.update(id, updateData);
            
            res.json({
                message: 'Category updated successfully',
                category: updatedCategory
            });
        } catch (error) {
            console.error('Update category error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Удаление категории (мягкое удаление, только для администраторов)
    static async deleteCategory(req, res) {
        try {
            const { id } = req.params;
            await Category.delete(id);
            
            res.json({ message: 'Category deactivated successfully' });
        } catch (error) {
            console.error('Delete category error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Полное удаление категории (только для администраторов, осторожно!)
    static async forceDeleteCategory(req, res) {
        try {
            const { id } = req.params;
            const deleted = await Category.forceDelete(id);
            
            if (!deleted) {
                return res.status(404).json({ error: 'Category not found' });
            }
            
            res.json({ message: 'Category permanently deleted' });
        } catch (error) {
            console.error('Force delete category error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Получение подкатегорий
    static async getSubcategories(req, res) {
        try {
            const { parentId } = req.params;
            
            const subcategories = await db.all(`
                SELECT c.*, 
                       (SELECT COUNT(*) FROM products WHERE category_id = c.id) as product_count
                FROM categories c
                WHERE c.parent_id = ? AND c.is_active = 1
                ORDER BY c.name
            `, [parentId]);
            
            res.json({
                subcategories,
                count: subcategories.length
            });
        } catch (error) {
            console.error('Get subcategories error:', error);
            res.status(500).json({ error: 'Failed to get subcategories' });
        }
    }
}

module.exports = CategoryController;