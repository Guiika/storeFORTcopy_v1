const Product = require('../models/Product');
const Category = require('../models/Category');
const db = require('../config/database');

class CatalogController {
    // ===== СТАТИЧЕСКИЕ МЕТОДЫ-ПОМОЩНИКИ (ДОЛЖНЫ БЫТЬ ПЕРВЫМИ) =====
    
    // Парсинг фильтров из query параметров
    static parseFilters(query) {
        const filters = {
            min_price: query.min_price ? parseFloat(query.min_price) : undefined,
            max_price: query.max_price ? parseFloat(query.max_price) : undefined,
            in_stock_only: query.in_stock_only === 'true',
            featured_only: query.featured_only === 'true',
            search: query.search || '',
            limit: query.limit ? parseInt(query.limit) : 20,
            offset: query.offset ? parseInt(query.offset) : 0,
            sort_by: query.sort_by || 'created_at',
            sort_order: query.sort_order || 'DESC'
        };
        
        // Парсинг массивов
        if (query.colors) {
            filters.colors = Array.isArray(query.colors) ? query.colors : [query.colors];
        }
        
        if (query.sizes) {
            filters.sizes = Array.isArray(query.sizes) ? query.sizes : [query.sizes];
        }
        
        if (query.brands) {
            filters.brands = Array.isArray(query.brands) ? query.brands : [query.brands];
        }
        
        return filters;
    }

    // Проверка, является ли товар новым (до 30 дней)
    static isProductNew(createdAt) {
        const createdDate = new Date(createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        return createdDate > thirtyDaysAgo;
    }

    // ===== ОСНОВНЫЕ МЕТОДЫ КОНТРОЛЛЕРА =====
    
    // Получение главной страницы каталога
    static async getHomepage(req, res) {
        try {
            const [
                popularProducts,
                newArrivals,
                discountedProducts,
                categories
            ] = await Promise.all([
                Product.getPopularProducts(8),
                Product.getNewArrivals(8),
                Product.getDiscountedProducts(8),
                Category.findAllWithProductCount()
            ]);
            
            res.json({
                popular_products: popularProducts || [],
                new_arrivals: newArrivals || [],
                discounted_products: discountedProducts || [],
                categories: categories || [],
                banners: [
                    {
                        id: 1,
                        title: "Summer Sale",
                        subtitle: "Up to 50% off",
                        image_url: "/uploads/banners/summer-sale.jpg",
                        link: "/categories/2?discount=true"
                    },
                    {
                        id: 2,
                        title: "New Collection",
                        subtitle: "Discover latest trends",
                        image_url: "/uploads/banners/new-collection.jpg",
                        link: "/categories/3"
                    }
                ]
            });
        } catch (error) {
            console.error('Get homepage error:', error);
            res.status(500).json({ error: 'Failed to load homepage data' });
        }
    }

    // Получение страницы категории с товарами
    static async getCategoryPage(req, res) {
        try {
            const { id } = req.params;
            
            // Теперь parseFilters доступен, потому что объявлен выше
            const filters = CatalogController.parseFilters(req.query);
            
            // Получаем категорию
            const category = await Category.findById(id);
            if (!category || !category.is_active) {
                return res.status(404).json({ error: 'Category not found' });
            }
            
            // Получаем подкатегории
            const subcategories = await Category.getAllSubcategories(id);
            
            // Получаем все ID категорий (текущая + подкатегории)
            const categoryIds = [parseInt(id), ...subcategories.map(sc => sc.id)];
            
            // Получаем товары
            const products = await Product.findByCategoryIds(categoryIds, filters);
            
            // Получаем доступные фильтры для категории
            const availableFilters = await Product.getFiltersForCategory(categoryIds);
            
            res.json({
                category: {
                    id: category.id,
                    name: category.name,
                    description: category.description,
                    parent_id: category.parent_id,
                    parent_name: category.parent_name,
                    subcategories: subcategories.map(sc => ({
                        id: sc.id,
                        name: sc.name,
                        product_count: sc.product_count || 0
                    }))
                },
                products,
                filters: {
                    applied: filters,
                    available: availableFilters
                },
                pagination: {
                    total: products.length,
                    limit: filters.limit,
                    offset: filters.offset,
                    has_more: products.length === filters.limit
                }
            });
        } catch (error) {
            console.error('Get category page error:', error);
            res.status(500).json({ error: 'Failed to load category page' });
        }
    }

    // Получение детальной страницы товара
    static async getProductDetail(req, res) {
        try {
            const { id } = req.params;
            
            // Получаем товар с полной информацией
            const product = await Product.findById(id);
            
            if (!product || !product.is_active) {
                return res.status(404).json({ error: 'Product not found' });
            }
            
            // Увеличиваем счетчик просмотров (не ждем результат)
            Product.incrementViews(id).catch(err => 
                console.error('Error incrementing views:', err)
            );
            
            // Получаем рекомендованные товары
            const recommended = await Product.getRecommended(id, 4);
            
            // Получаем все изображения товара
            const images = await Product.getImages(id);
            
            res.json({
                product: {
                    ...product,
                    images: images
                },
                recommended_products: recommended || [],
                related_attributes: {
                    in_stock: product.stock_quantity > 0,
                    discount_percent: product.old_price ? 
                        Math.round(((product.old_price - product.price) / product.old_price) * 100) : 0,
                    // isProductNew теперь доступен
                    is_new: CatalogController.isProductNew(product.created_at)
                }
            });
        } catch (error) {
            console.error('Get product detail error:', error);
            res.status(500).json({ error: 'Failed to load product details' });
        }
    }

    // Быстрый поиск для автодополнения
    static async quickSearch(req, res) {
        try {
            const query = req.query.q;
            const limit = req.query.limit ? parseInt(req.query.limit) : 5;
            
            if (!query || query.trim().length < 2) {
                return res.json({
                    products: [],
                    categories: [],
                    suggestions: []
                });
            }
            
            const searchTerm = `%${query}%`;
            
            // Поиск товаров
            const products = await db.all(`
                SELECT p.id, p.name, p.price, p.sku,
                       (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as main_image
                FROM products p
                WHERE p.is_active = 1 
                  AND (p.name LIKE ? OR p.sku LIKE ? OR p.brand LIKE ?)
                LIMIT ?
            `, [searchTerm, searchTerm, searchTerm, limit]);
            
            // Поиск категорий
            const categories = await db.all(`
                SELECT id, name
                FROM categories
                WHERE is_active = 1 AND name LIKE ?
                LIMIT 3
            `, [searchTerm]);
            
            res.json({
                query,
                products: products || [],
                categories: categories || [],
                suggestions: [
                    `${query} in men's clothing`,
                    `${query} on sale`,
                    `${query} in black`
                ]
            });
        } catch (error) {
            console.error('Quick search error:', error);
            res.status(500).json({ error: 'Search failed' });
        }
    }

    // Получение фильтров для поиска
    static async getSearchFilters(req, res) {
        try {
            const searchTerm = req.query.q;
            
            if (!searchTerm || searchTerm.trim().length < 2) {
                return res.status(400).json({ error: 'Search term is required' });
            }
            
            const searchQuery = `%${searchTerm}%`;
            
            // Получаем уникальные значения для фильтров из найденных товаров
            const [colors, sizes, brands, priceRange] = await Promise.all([
                db.all(`
                    SELECT DISTINCT color 
                    FROM products 
                    WHERE is_active = 1 
                      AND (name LIKE ? OR description LIKE ? OR brand LIKE ?)
                      AND color IS NOT NULL 
                      AND color != ''
                    ORDER BY color
                `, [searchQuery, searchQuery, searchQuery]),
                
                db.all(`
                    SELECT DISTINCT size 
                    FROM products 
                    WHERE is_active = 1 
                      AND (name LIKE ? OR description LIKE ? OR brand LIKE ?)
                      AND size IS NOT NULL 
                      AND size != ''
                    ORDER BY size
                `, [searchQuery, searchQuery, searchQuery]),
                
                db.all(`
                    SELECT DISTINCT brand 
                    FROM products 
                    WHERE is_active = 1 
                      AND (name LIKE ? OR description LIKE ? OR brand LIKE ?)
                      AND brand IS NOT NULL 
                      AND brand != ''
                    ORDER BY brand
                `, [searchQuery, searchQuery, searchQuery]),
                
                db.get(`
                    SELECT MIN(price) as min_price, MAX(price) as max_price
                    FROM products 
                    WHERE is_active = 1 
                      AND (name LIKE ? OR description LIKE ? OR brand LIKE ?)
                `, [searchQuery, searchQuery, searchQuery])
            ]);
            
            res.json({
                colors: colors ? colors.map(c => c.color) : [],
                sizes: sizes ? sizes.map(s => s.size) : [],
                brands: brands ? brands.map(b => b.brand) : [],
                price_range: {
                    min: priceRange ? priceRange.min_price || 0 : 0,
                    max: priceRange ? priceRange.max_price || 0 : 0
                }
            });
        } catch (error) {
            console.error('Get search filters error:', error);
            res.status(500).json({ error: 'Failed to get search filters' });
        }
    }

    // Все товары (расширенный поиск)
    static async getAllProducts(req, res) {
        try {
            const filters = this.parseFilters(req.query);
            
            // Если нет конкретной категории, ищем во всех активных товарах
            const products = await Product.findAll(filters);
            const total = await Product.count(filters);
            
            // Получаем общие фильтры для всех товаров
            const allFilters = await db.get(`
                SELECT 
                    MIN(price) as min_price,
                    MAX(price) as max_price
                FROM products 
                WHERE is_active = 1
            `);
            
            // Получаем уникальные значения
            const colors = await db.all(`
                SELECT DISTINCT color 
                FROM products 
                WHERE is_active = 1 AND color IS NOT NULL AND color != ''
                ORDER BY color
            `);
            
            const sizes = await db.all(`
                SELECT DISTINCT size 
                FROM products 
                WHERE is_active = 1 AND size IS NOT NULL AND size != ''
                ORDER BY size
            `);
            
            const brands = await db.all(`
                SELECT DISTINCT brand 
                FROM products 
                WHERE is_active = 1 AND brand IS NOT NULL AND brand != ''
                ORDER BY brand
            `);
            
            res.json({
                products,
                filters: {
                    applied: filters,
                    available: {
                        price_range: {
                            min: allFilters ? allFilters.min_price || 0 : 0,
                            max: allFilters ? allFilters.max_price || 0 : 0
                        },
                        colors: colors.map(c => c.color),
                        sizes: sizes.map(s => s.size),
                        brands: brands.map(b => b.brand)
                    }
                },
                pagination: {
                    total,
                    limit: filters.limit,
                    offset: filters.offset,
                    has_more: (filters.offset + filters.limit) < total
                }
            });
        } catch (error) {
            console.error('Get all products error:', error);
            res.status(500).json({ error: 'Failed to get products' });
        }
    }
}

module.exports = CatalogController;