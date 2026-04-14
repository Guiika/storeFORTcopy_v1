const Product = require('../models/Product');
const path = require('path');

class ProductController {
    // Создание товара (админ)
    static async createProduct(req, res) {
        try {
            const productData = req.body;
            
            // Преобразуем числовые поля
            if (productData.price) productData.price = parseFloat(productData.price);
            if (productData.old_price) productData.old_price = parseFloat(productData.old_price);
            if (productData.stock_quantity) productData.stock_quantity = parseInt(productData.stock_quantity);
            if (productData.weight_kg) productData.weight_kg = parseFloat(productData.weight_kg);
            if (productData.category_id) productData.category_id = parseInt(productData.category_id);
            
            const product = await Product.create(productData);
            
            res.status(201).json({
                message: 'Product created successfully',
                product
            });
        } catch (error) {
            console.error('Create product error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Получение всех товаров с фильтрацией (публичный)
    static async getAllProducts(req, res) {
        try {
            const filters = {
                category_id: req.query.category_id ? parseInt(req.query.category_id) : undefined,
                min_price: req.query.min_price ? parseFloat(req.query.min_price) : undefined,
                max_price: req.query.max_price ? parseFloat(req.query.max_price) : undefined,
                in_stock_only: req.query.in_stock_only === 'true',
                featured_only: req.query.featured_only === 'true',
                search: req.query.search || '',
                limit: req.query.limit ? parseInt(req.query.limit) : 50,
                offset: req.query.offset ? parseInt(req.query.offset) : 0,
                sort_by: req.query.sort_by || 'created_at',
                sort_order: req.query.sort_order || 'DESC'
            };
            
            const products = await Product.findAll(filters);
            const total = await Product.count(filters);
            
            res.json({
                products,
                pagination: {
                    total,
                    limit: filters.limit,
                    offset: filters.offset,
                    has_more: (filters.offset + filters.limit) < total
                }
            });
        } catch (error) {
            console.error('Get products error:', error);
            res.status(500).json({ error: 'Failed to get products' });
        }
    }

    // Получение товара по ID (публичный)
    static async getProductById(req, res) {
        try {
            const { id } = req.params;
            const product = await Product.findById(id);
            
            if (!product || !product.is_active) {
                return res.status(404).json({ error: 'Product not found' });
            }
            
            res.json({ product });
        } catch (error) {
            console.error('Get product error:', error);
            res.status(500).json({ error: 'Failed to get product' });
        }
    }

    // Обновление товара (админ)
    static async updateProduct(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            // Преобразуем числовые поля
            if (updateData.price) updateData.price = parseFloat(updateData.price);
            if (updateData.old_price) updateData.old_price = parseFloat(updateData.old_price);
            if (updateData.stock_quantity) updateData.stock_quantity = parseInt(updateData.stock_quantity);
            if (updateData.weight_kg) updateData.weight_kg = parseFloat(updateData.weight_kg);
            if (updateData.category_id) updateData.category_id = parseInt(updateData.category_id);
            
            const updatedProduct = await Product.update(id, updateData);
            
            res.json({
                message: 'Product updated successfully',
                product: updatedProduct
            });
        } catch (error) {
            console.error('Update product error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Удаление товара (админ, мягкое удаление)
    static async deleteProduct(req, res) {
        try {
            const { id } = req.params;
            await Product.delete(id);
            
            res.json({ message: 'Product deactivated successfully' });
        } catch (error) {
            console.error('Delete product error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Загрузка изображения товара (админ)
    static async uploadImage(req, res) {
        try {
            const { id } = req.params;
            const isMain = req.body.is_main === 'true';
            
            if (!req.file) {
                return res.status(400).json({ error: 'No image file provided' });
            }
            
            // Проверяем существование товара
            const productExists = await Product.exists(id);
            if (!productExists) {
                return res.status(404).json({ error: 'Product not found' });
            }
            
            // Создаем URL для изображения
            const imageUrl = `/uploads/${req.file.filename}`;
            
            // Добавляем изображение в базу данных
            const imageId = await Product.addImage(id, imageUrl, isMain);
            
            res.status(201).json({
                message: 'Image uploaded successfully',
                image: {
                    id: imageId,
                    product_id: id,
                    image_url: imageUrl,
                    is_main: isMain
                }
            });
        } catch (error) {
            console.error('Upload image error:', error);
            res.status(500).json({ error: 'Failed to upload image' });
        }
    }

    // Получение изображений товара (публичный)
    static async getProductImages(req, res) {
        try {
            const { id } = req.params;
            const images = await Product.getImages(id);
            
            res.json({
                product_id: id,
                images,
                count: images.length
            });
        } catch (error) {
            console.error('Get product images error:', error);
            res.status(500).json({ error: 'Failed to get product images' });
        }
    }

    // Удаление изображения (админ)
    static async deleteImage(req, res) {
        try {
            const { id } = req.params;
            const deleted = await Product.deleteImage(id);
            
            if (!deleted) {
                return res.status(404).json({ error: 'Image not found' });
            }
            
            res.json({ message: 'Image deleted successfully' });
        } catch (error) {
            console.error('Delete image error:', error);
            res.status(500).json({ error: 'Failed to delete image' });
        }
    }

    // Обновление информации об изображении (админ)
    static async updateImage(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            if (updateData.is_main !== undefined) {
                updateData.is_main = updateData.is_main === 'true';
            }
            
            if (updateData.display_order !== undefined) {
                updateData.display_order = parseInt(updateData.display_order);
            }
            
            const updatedImage = await Product.updateImage(id, updateData);
            
            res.json({
                message: 'Image updated successfully',
                image: updatedImage
            });
        } catch (error) {
            console.error('Update image error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Получение рекомендованных товаров (публичный)
    static async getRecommendedProducts(req, res) {
        try {
            const { id } = req.params;
            const limit = req.query.limit ? parseInt(req.query.limit) : 4;
            
            const recommended = await Product.getRecommended(id, limit);
            
            res.json({
                product_id: id,
                recommended,
                count: recommended.length
            });
        } catch (error) {
            console.error('Get recommended products error:', error);
            res.status(500).json({ error: 'Failed to get recommended products' });
        }
    }

    // Поиск товаров (публичный)
    static async searchProducts(req, res) {
        try {
            const searchTerm = req.query.q;
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            
            if (!searchTerm || searchTerm.trim().length < 2) {
                return res.status(400).json({ error: 'Search term must be at least 2 characters' });
            }
            
            const products = await Product.findAll({
                search: searchTerm,
                limit: limit
            });
            
            res.json({
                query: searchTerm,
                products,
                count: products.length
            });
        } catch (error) {
            console.error('Search products error:', error);
            res.status(500).json({ error: 'Search failed' });
        }
    }
}

module.exports = ProductController;